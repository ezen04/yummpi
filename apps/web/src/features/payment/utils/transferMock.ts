// 계좌번호·은행명·예금주 실명은 API/DB에 저장하지 않는다.
// 이 파일의 더미값은 UI 표시 전용이며 결제 증빙과 무관하다.

export type TransferMockDisplayData = {
  recipientLabel: string; // '모임장' 또는 '모임장 지훈'
  bank: string; // '윰피뱅크' (더미)
  accountNumber: string; // '***-**-1234' (더미)
  amount: number; // Payment.amount (원 단위 정수)
  formattedAmount: string; // '21,000원'
  copyAccountLabel: string; // 계좌 복사 버튼용 텍스트
  fallbackActionLabel: string; // '금액 복사'
};

export function buildTransferMockData(
  amount: number,
  hostNickname?: string,
  account?: { bank: string; accountNumber: string } | null
): TransferMockDisplayData {
  const bank = account?.bank ?? '윰피뱅크';
  const accountNumber = account?.accountNumber ?? '***-**-1234';
  const recipientLabel = hostNickname ? `모임장 ${hostNickname}` : '모임장';

  return {
    recipientLabel,
    bank,
    accountNumber,
    amount,
    formattedAmount: formatAmount(amount),
    copyAccountLabel: `${bank} ${accountNumber}`,
    fallbackActionLabel: '금액 복사',
  };
}

export function formatAmount(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
