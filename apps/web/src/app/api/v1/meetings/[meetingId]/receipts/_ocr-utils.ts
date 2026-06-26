import type { Prisma } from '@prisma/client';
import type { OcrToken, ParsedItem } from '@yummpi/schemas';
import { maskSensitive } from '@/lib/ocr/parser';
import type { ReceiptItemInput } from './_receipt-input';

// 파서가 unitPrice=null로 낸 품목(끝 숫자 1~2개라 단가를 못 가른 경우, quantity=1
// 폴백과 함께 나온다)은 DB unit_price 컬럼이 NOT NULL이라 그대로 못 넣는다.
// totalPrice/quantity로 역산해 채운다 — quantity=1인 가장 흔한 경우엔 unitPrice
// = totalPrice와 같아져 자연스럽다.
//
// quantity>=2면 Math.round로 1원 단위 라운딩 차이(unitPrice*quantity !==
// totalPrice)가 생길 수 있다. 분배 엔진(lib/settlement-engine)은 unitPrice를
// 읽지 않고 totalPrice만으로 배분하므로 현재는 영향 없음 — unitPrice는 검수
// 화면 표시용. 분배 엔진이 unitPrice를 입력으로 쓰게 바뀌면 이 라운딩 차이를
// 다시 검토해야 한다.
export function toReceiptItemInputs(items: ParsedItem[]): ReceiptItemInput[] {
  return items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice ?? Math.round(item.totalPrice / item.quantity),
    totalPrice: item.totalPrice,
    ocrConfidence: item.confidence,
  }));
}

// totalAmount = Σ items.totalPrice — 파서 원본 totalAmount는 저장하지 않는다
// (검수 UI #3 SUM_MISMATCH 배너 폐기 결정과 정합. items가 0개면 null —
// "0원짜리 진짜 영수증"과 구분).
export function sumItemTotals(items: ReceiptItemInput[]): number | null {
  if (items.length === 0) return null;
  return items.reduce((sum, item) => sum + item.totalPrice, 0);
}

// raw_ocr_json 저장 전 카드번호 등 민감정보 마스킹 (work-doc §4.6, api-spec §9
// "카드번호 마스킹 후 저장"). 파서가 쓰는 maskSensitive와 동일 규칙을 토큰
// text 필드에 그대로 적용한다.
export function maskTokensForStorage(
  tokens: OcrToken[]
): Prisma.InputJsonValue {
  return tokens.map((t) => ({ ...t, text: maskSensitive(t.text) }));
}
