'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { MessageCircle, User, Settings, LogOut } from 'lucide-react';
import type { JWTPayload } from '@/lib/types';

export default function AppHeader({ user }: { user: JWTPayload }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/conversations" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Chat
              </span>
            </Link>

            <nav className="hidden md:flex space-x-4">
              <Link
                href="/conversations"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  pathname?.startsWith('/conversations')
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Conversations
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/profile"
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Profile"
            >
              <User className="w-5 h-5" />
            </Link>

            <Link
              href="/settings"
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center text-white font-medium text-sm">
                {user.username[0].toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {user.username}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
