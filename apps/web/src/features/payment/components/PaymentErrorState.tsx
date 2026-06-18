'use client';

type Props = {
  message?: string;
  onRetry: () => void;
};

export function PaymentErrorState({
  message = '송금 현황을 불러오지 못했어요',
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 헤더 */}
      <div className="h-[104px] px-5 flex items-end pb-4 border-b border-gray-100">
        <span className="text-base font-semibold mx-auto">송금 현황</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-base font-medium text-gray-800">{message}</p>
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-600 active:bg-gray-50"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
