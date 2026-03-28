import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/AppHeader';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader user={user} />
      <main>{children}</main>
    </div>
  );
}
