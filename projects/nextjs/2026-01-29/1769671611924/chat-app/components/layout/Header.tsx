'use client';

import { signOut } from 'next-auth/react';
import Button from '@/components/ui/Button';

export interface HeaderProps {
  userName?: string | null;
  userEmail?: string | null;
}

export default function Header({ userName, userEmail }: HeaderProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-sm">
            C
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Claude Chat</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            {userName && (
              <div className="text-sm font-medium text-gray-900">{userName}</div>
            )}
            {userEmail && (
              <div className="text-xs text-gray-500">{userEmail}</div>
            )}
          </div>
          <Button onClick={handleSignOut} variant="ghost" size="sm">
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
