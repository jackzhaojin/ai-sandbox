import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { User, Mail, Calendar, MessageSquare } from 'lucide-react';
import type { User as UserType } from '@/lib/types';

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  // Get user details
  const user = db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(currentUser.userId) as UserType;

  // Get conversation count
  const conversationCount = db
    .prepare(
      'SELECT COUNT(*) as count FROM conversation_members WHERE user_id = ?'
    )
    .get(currentUser.userId) as { count: number };

  // Get message count
  const messageCount = db
    .prepare('SELECT COUNT(*) as count FROM messages WHERE sender_id = ?')
    .get(currentUser.userId) as { count: number };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="h-32 bg-gradient-to-r from-purple-600 to-blue-600"></div>

        <div className="px-8 pb-8">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-16 mb-6">
            <div
              className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center text-white text-4xl font-bold shadow-lg"
              style={{ background: user.avatar_color }}
            >
              {user.username[0].toUpperCase()}
            </div>
          </div>

          {/* User Info */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {user.username}
            </h1>
            <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Conversations
                </span>
                <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {conversationCount.count}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Messages Sent
                </span>
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {messageCount.count}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Member Since
                </span>
                <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {Math.floor((Date.now() - user.created_at) / (1000 * 60 * 60 * 24))} days
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
