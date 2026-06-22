type FoodCategory =
  | 'korean'
  | 'japanese'
  | 'chinese'
  | 'meat'
  | 'cafe'
  | 'western';

export function mapKakaoCategoryToThumbnail(
  categoryName: string | null | undefined
): FoodCategory {
  if (!categoryName) return 'korean';

  if (/일식|초밥|회|라멘|돈가스|돈까스|규동|우동|덮밥/.test(categoryName))
    return 'japanese';
  if (/중식|중국집|중화|짜장|짬뽕|마라/.test(categoryName)) return 'chinese';
  if (/고기|삼겹살|구이|곱창|갈비|육류|샤브샤브/.test(categoryName))
    return 'meat';
  if (/카페|커피|디저트|베이커리|빵/.test(categoryName)) return 'cafe';
  if (
    /양식|이탈리아|프랑스|스테이크|파스타|피자|버거|샌드위치|뷔페/.test(
      categoryName
    )
  )
    return 'western';

  return 'korean';
}

export function shortenKakaoCategory(
  categoryName: string | null | undefined
): string {
  if (!categoryName) return '';
  const parts = categoryName.split('>').map((s) => s.trim());
  return parts[parts.length - 1] ?? '';
}
