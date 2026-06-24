import type {
  OcrToken,
  ParsedItem,
  OcrValidation,
  OcrParserOutput,
} from '@yummpi/schemas';

// OCR 규칙 기반 파서 — P0 stub.
// TDD RED 단계: 5함수 전부 동일하게 throw 하여 균일한 NOT_IMPLEMENTED 실패를 낸다.
// 내부 분류(classify)는 비공개로 두고, parseReceipt 가 조립한다.

// 라인 재구성 — work-doc §4.2.
// cy 오름차순 → 마지막 줄의 평균 cy와 비교, 그 줄의 평균 height·50% 이내(≤)면 같은 줄.
// 같은 줄 안에서는 cx 오름차순. lineBreak 플래그는 좌표 기반 결정의 보조이므로 P0에선 미사용.
const avg = (nums: number[]): number =>
  nums.reduce((s, n) => s + n, 0) / nums.length;

export function groupIntoLines(tokens: OcrToken[]): OcrToken[][] {
  const sorted = [...tokens].sort((a, b) => a.cy - b.cy);
  const lines: OcrToken[][] = [];

  for (const token of sorted) {
    const last = lines.at(-1);
    if (last) {
      const lineCy = avg(last.map((t) => t.cy));
      const threshold = avg(last.map((t) => t.height)) * 0.5;
      if (Math.abs(token.cy - lineCy) <= threshold) {
        last.push(token);
        continue;
      }
    }
    lines.push([token]);
  }
  return lines.map((line) => [...line].sort((a, b) => a.cx - b.cx));
}

// 품목 라인 파싱 — work-doc §4.3.
// 함정: "참이슬 360ml" 같은 메뉴명 내 숫자 → 끝에서부터 최대 3개의 순수 숫자 토큰만 본다.
// 칸 순서 무관: [수량 단가 금액] / [단가 수량 금액] 모두 곱이 금액과 맞고 작은 쪽이 수량 범위(≤99)면
// 작은 쪽=수량·큰 쪽=단가. 곱 불일치는 금액만 확정·수량1 폴백(검수에서 수정).
const NUM = /^[\d,]+$/;
const QTY = /^\d{1,2}$/;

const item = (
  name: string,
  quantity: number,
  unitPrice: number | null,
  totalPrice: number,
  confidence: number
): ParsedItem => ({ name, quantity, unitPrice, totalPrice, confidence });

export function parseItemLine(tokens: OcrToken[]): ParsedItem | null {
  const nums: number[] = [];
  let i = tokens.length - 1;
  while (i >= 0 && nums.length < 3 && NUM.test(tokens[i].text)) {
    nums.unshift(parseInt(tokens[i].text.replace(/,/g, ''), 10));
    i--;
  }
  if (nums.length === 0) return null;

  const name = tokens
    .slice(0, i + 1)
    .map((t) => t.text)
    .join(' ')
    .trim();
  if (!name) return null;

  // confidence(P0) = min(라인 토큰 inferConfidence) 원시값. 파싱 점수 합성은 P1.
  const confidence = Math.min(...tokens.map((t) => t.confidence));

  // 금액 = 항상 끝 숫자 (포맷 불변 앵커).
  const total = nums[nums.length - 1];

  if (nums.length === 1) return item(name, 1, null, total, confidence);

  if (nums.length === 2) {
    if (QTY.test(String(nums[0])))
      return item(name, nums[0], null, total, confidence);
    return item(name, 1, null, total, confidence);
  }

  // 3숫자: 곱셈 매치 + 작은 쪽 ≤99 → 작은 쪽=수량·큰 쪽=단가. 아니면 금액만 확정·폴백.
  const [x, y] = nums;
  if (x * y === total && Math.min(x, y) <= 99) {
    return item(name, Math.min(x, y), Math.max(x, y), total, confidence);
  }
  return item(name, 1, null, total, confidence);
}

// 검산 — work-doc §4.4. 잔액 0 엄격(앵커=합계, 정상이면 residual=0).
// 양·음 무관 SUM_MISMATCH(diff 부호 그대로) — 옛 '양수=거짓경보 방패' 폐기.
// 이슈 누적 패턴은 P1 warn(품목 누락 의심) 확장 여지 유지.
export function validate(input: {
  items: ParsedItem[];
  totalAmount: number | null;
}): OcrValidation {
  const itemSum = input.items.reduce((s, it) => s + it.totalPrice, 0);
  const issues: OcrValidation['issues'] = [];

  if (input.totalAmount === null) {
    // diff 키 자체를 넣지 않는다(부재 — V1 단언).
    issues.push({ code: 'NO_TOTAL', level: 'error' });
  } else {
    const residual = input.totalAmount - itemSum;
    if (residual !== 0) {
      issues.push({ code: 'SUM_MISMATCH', level: 'error', diff: residual });
    }
  }

  return { ok: issues.every((i) => i.level !== 'error'), issues };
}

// 카드번호 마스킹 — work-doc §4.6.
// 첫 패턴: 4-4-4-4 (구분자: `-` | ` ` | 없음).
// 둘째 패턴: `1234-56**-****-7890` 부분 마스킹본도 완전 마스킹으로 덮어쓰기.
// 셋째 패턴: CLOVA 부분 마스킹 `448125**********` — 앞 4-6자리 가시 + 별표 8-12개
//   (카드 14-16자리에서 가시 4-6 차감). 끝은 `(?!\*)`로 추가 별표 차단(`*`는 word char가
//   아니라 `\b`로는 경계 못 잡음). `12**** 적립` 같은 짧은 본문은 별표 길이 미달로 비매치.
// /g 다중 매치, 전화(3-4-4)·사업자(3-2-5)는 비매치(\b로 4자리 경계 강제).
const CARD =
  /\b\d{4}[- *]?\d{4}[- *]?\d{4}[- *]?\d{4}\b|\b\d{4}[- *]?\d{2}\*{2}[- *]?\*{4}[- *]?\d{4}\b|\b\d{4,6}\*{8,12}(?!\*)/g;

export function maskSensitive(text: string): string {
  return text.replace(CARD, '****-****-****-****');
}

// 영수증 조립 — work-doc §4.3 분류 + §4.4 검산 임베드 + §4.6 마스킹.
// 위치 무관 키워드 우선 분류. SUMMARY 줄은 폐기하되, TOTAL_KEYWORD에 해당하면 amount 추출 후
// 우선순위 인덱스가 더 낮은(=합계 우선) 후보를 totalAmount로 유지. 합계 줄 통과 뒤(afterTotal)
// 등장하는 푸터는 UNCLASSIFIED로 잡되 마스킹.
const SUMMARY_KEYWORDS = [
  '합계',
  '총액',
  '받을금액',
  '받을 금액',
  '결제금액',
  '부가세',
  '공급가액',
  '과세물품',
  '면세물품',
  '봉사료',
  '할인',
  '쿠폰',
  '포인트',
  '적립',
  '신용카드',
  '현금',
  '승인',
  'TOTAL',
];

// 합계 ≻ 총액 ≻ 받을 금액 / 받을금액 / 결제금액 ≻ TOTAL.
// findIndex 가장 낮은 인덱스가 우승 — 합계 부재 시 받을금액 폴백(P5b).
const TOTAL_KEYWORD_PRIORITY = [
  '합계',
  '총액',
  '받을 금액',
  '받을금액',
  '결제금액',
  'TOTAL',
] as const;

const HEADER_KEYWORDS = ['사업자', '대표자', 'TEL', '전화', '주소', '주문번호'];

// 소계 한정어 — 줄에 TOTAL 키워드("합계")가 있어도 이 한정어가 섞이면 세 전 소계(공급가액·
// 과세/면세 합계)라 진짜 총액이 아니다. 실측: 다이소 영수증 "과세 합계 3,636" vs "판매 합계 4,000".
const SUBTOTAL_QUALIFIERS = ['과세', '면세', '공급'];

// 줄의 마지막 숫자 토큰을 amount로 추출 (합계 30,000 / TOTAL 30000 등).
function extractLastNumber(tokens: OcrToken[]): number | null {
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (NUM.test(tokens[i].text)) {
      return parseInt(tokens[i].text.replace(/,/g, ''), 10);
    }
  }
  return null;
}

export function parseReceipt(tokens: OcrToken[]): OcrParserOutput {
  const lines = groupIntoLines(tokens);
  const items: ParsedItem[] = [];
  const unclassifiedLines: string[] = [];

  let totalCandidate: { priority: number; amount: number } | null = null;
  let afterTotal = false;

  for (const lineTokens of lines) {
    const lineText = lineTokens.map((t) => t.text).join(' ');

    // 1) SUMMARY 우선 — TOTAL_KEYWORD 후보면 우선순위 비교 후 채택, 그 외 요약 줄은 폐기.
    // OCR이 한글 합계 키워드를 "합 계"처럼 토큰으로 쪼개 읽는 사례(실측: 이마트 영수증)가
    // 있어 TOTAL 키워드만 공백 제거 후 비교한다. 그 외 요약 키워드는 오탐 방지를 위해
    // 기존(공백 유지) 매칭을 유지.
    const lineCompact = lineText.replace(/\s/g, '');
    const rawTotalKwIdx = TOTAL_KEYWORD_PRIORITY.findIndex((k) =>
      lineCompact.includes(k.replace(/\s/g, ''))
    );
    // "과세 합계"처럼 소계 한정어(과세/면세/공급) + 합계 키워드가 함께 있는 줄만 소계로 본다.
    // 그래야 "과세 합계"(소계)를 건너뛰고 뒤의 "판매 합계"(진짜 총액)를 잡고 afterTotal 조기 발동도
    // 막는다. 한정어만 있고 합계 키워드가 없는 줄(예: 품목명에 "공급")은 건드리지 않는다.
    const isSubtotal =
      rawTotalKwIdx !== -1 &&
      SUBTOTAL_QUALIFIERS.some((q) => lineCompact.includes(q));
    const totalKwIdx = isSubtotal ? -1 : rawTotalKwIdx;
    if (
      totalKwIdx !== -1 ||
      isSubtotal ||
      SUMMARY_KEYWORDS.some((k) => lineText.includes(k))
    ) {
      if (totalKwIdx !== -1) {
        const amount = extractLastNumber(lineTokens);
        if (amount !== null) {
          if (totalCandidate === null || totalKwIdx < totalCandidate.priority) {
            totalCandidate = { priority: totalKwIdx, amount };
          }
          afterTotal = true;
        }
      }
      continue;
    }

    // 2) 합계 줄 이후 등장하는 푸터 — 품목 부활 금지, UNCLASSIFIED + 마스킹.
    if (afterTotal) {
      unclassifiedLines.push(maskSensitive(lineText));
      continue;
    }

    // 3) HEADER 키워드 줄 — items도 unclassifiedLines도 아님 (폐기).
    if (HEADER_KEYWORDS.some((k) => lineText.includes(k))) {
      continue;
    }

    // 4) ITEM 시도.
    const parsed = parseItemLine(lineTokens);
    if (parsed !== null) {
      items.push(parsed);
      continue;
    }

    // 5) UNCLASSIFIED — 원본 노출 금지(§4.6): unclassifiedLines 생성 전에 마스킹 적용.
    unclassifiedLines.push(maskSensitive(lineText));
  }

  const totalAmount = totalCandidate?.amount ?? null;
  const validation = validate({ items, totalAmount });

  return { totalAmount, items, unclassifiedLines, validation };
}
