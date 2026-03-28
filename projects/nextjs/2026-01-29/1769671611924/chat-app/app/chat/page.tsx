import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ChatLayout from '@/components/chat/ChatLayout';

export default async function ChatPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <ChatLayout
      userName={session.user?.name}
      userEmail={session.user?.email}
    />
  );
}
