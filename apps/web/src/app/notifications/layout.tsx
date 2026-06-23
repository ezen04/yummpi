import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/current-member';

export default async function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/api/auth/signin');
  return <>{children}</>;
}
