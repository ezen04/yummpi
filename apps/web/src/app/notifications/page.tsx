export default function NotificationsPage() {
  return (
    <div className="px-4 py-6">
      <h1 className="text-lg font-semibold text-[var(--label-normal)] mb-6">
        알림
      </h1>
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <p className="text-[15px] text-[var(--label-alternative)]">
          알림이 없습니다
        </p>
      </div>
    </div>
  );
}
