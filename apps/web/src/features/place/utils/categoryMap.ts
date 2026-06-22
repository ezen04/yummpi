export type FoodCategory =
  | 'korean'
  | 'japanese'
  | 'chinese'
  | 'meat'
  | 'cafe'
  | 'western';

interface CategoryPattern {
  key: FoodCategory;
  label: string;
  regex: RegExp;
}

const CATEGORY_PATTERNS: CategoryPattern[] = [
  {
    key: 'japanese',
    label: '일식',
    regex: /일식|초밥|회|라멘|돈가스|돈까스|규동|우동|덮밥|스시/,
  },
  {
    key: 'chinese',
    label: '중식',
    regex: /중식|중국|중화|짜장|짬뽕|마라/,
  },
  {
    key: 'meat',
    label: '고기',
    regex: /고기|삼겹살|구이|곱창|갈비|육류|샤브샤브|숯불/,
  },
  {
    key: 'cafe',
    label: '카페',
    regex: /카페|커피|디저트|베이커리|빵/,
  },
  {
    key: 'western',
    label: '양식',
    regex:
      /양식|이탈리아|프랑스|스테이크|파스타|피자|버거|샌드위치|뷔페|패스트푸드/,
  },
  {
    key: 'korean',
    label: '한식',
    regex: /한식|국밥|찌개|백반|분식|김밥|떡볶이|면요리|치킨/,
  },
];

const DEFAULT_CATEGORY: CategoryPattern = CATEGORY_PATTERNS[5]; // 한식

function matchCategory(part: string): CategoryPattern | null {
  for (const pattern of CATEGORY_PATTERNS) {
    if (pattern.regex.test(part)) return pattern;
  }
  return null;
}

/**
 * 카카오 raw "음식점 > 한식 > 고기 > 삼겹살" 같은 카테고리를
 * 6가지 대분류 enum(korean/japanese/chinese/meat/cafe/western)으로 매핑.
 *
 * 매칭 규칙: `shortenKakaoCategory`와 동일 — 마지막(소분류)을 제외한
 * 나머지 parts에서 역순(끝쪽 우선)으로 6가지 매칭.
 * - "음식점 > 한식 > 고기 > 삼겹살" → ["한식", "고기"] → "고기" → meat
 * - "음식점 > 한식 > 덮밥"          → ["한식"]        → "한식" → korean
 * - "음식점 > 카페 > 커피전문점"     → ["카페"]        → "카페" → cafe
 *
 * 소분류를 포함해서 매칭하면 "음식점 > 한식 > 덮밥"이 일식으로 잘못 잡힘 — 회피.
 */
export function mapKakaoCategoryToThumbnail(
  categoryName: string | null | undefined
): FoodCategory {
  if (!categoryName) return DEFAULT_CATEGORY.key;
  const parts = categoryName
    .split('>')
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length > 1 && parts[0] === '음식점') {
    parts.shift();
  }

  if (parts.length === 0) return DEFAULT_CATEGORY.key;
  if (parts.length === 1) {
    const matched = matchCategory(parts[0]);
    return matched ? matched.key : DEFAULT_CATEGORY.key;
  }

  const restParts = parts.slice(0, -1);
  for (let i = restParts.length - 1; i >= 0; i--) {
    const matched = matchCategory(restParts[i]);
    if (matched) return matched.key;
  }
  return DEFAULT_CATEGORY.key;
}

/**
 * 카카오 raw "음식점 > 한식 > 고기 > 삼겹살" → "고기·삼겹살" 형식으로 단축.
 * - 대분류는 6가지(한식/일식/중식/양식/고기/카페) 중 매칭되는 가장 깊은(소분류 직전) 항목
 * - 소분류는 raw의 마지막 세그먼트
 * - 매칭되는 대분류가 없으면 기본 "한식" 사용
 */
export function shortenKakaoCategory(
  categoryName: string | null | undefined
): string {
  if (!categoryName) return '';
  const parts = categoryName
    .split('>')
    .map((s) => s.trim())
    .filter(Boolean);

  // 최상위 "음식점" 같은 prefix는 의미 없으므로 제거
  if (parts.length > 1 && parts[0] === '음식점') {
    parts.shift();
  }

  if (parts.length === 0) return '';
  if (parts.length === 1) {
    // 단일 항목: 6가지 매칭되면 그 label, 아니면 그대로
    const matched = matchCategory(parts[0]);
    return matched ? matched.label : parts[0];
  }

  const last = parts[parts.length - 1];
  const restParts = parts.slice(0, -1);

  // 가장 깊은(끝쪽) 항목부터 역순으로 6가지 매칭 시도
  for (let i = restParts.length - 1; i >= 0; i--) {
    const matched = matchCategory(restParts[i]);
    if (matched) return `${matched.label} · ${last}`;
  }

  // 매칭 없으면 기본 "한식"
  return `${DEFAULT_CATEGORY.label} · ${last}`;
}
