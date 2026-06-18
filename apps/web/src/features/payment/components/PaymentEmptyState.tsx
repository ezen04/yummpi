'use client';

export function PaymentEmptyState() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 헤더 */}
      <div className="h-[104px] px-5 flex items-end pb-4 border-b border-gray-100">
        <span className="text-base font-semibold mx-auto">송금 현황</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5 text-center">
        <p className="text-base font-medium text-gray-800">
          아직 정산이 확정되지 않았어요
        </p>
        <p className="text-sm text-gray-400">
          정산이 확정되면 송금을 시작할 수 있어요
        </p>
      </div>
    </div>
  );
}
