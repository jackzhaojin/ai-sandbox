'use client';

import { motion } from 'framer-motion';
import { formatTime } from '@/lib/utils';
import type { MessageWithUser } from '@/lib/types';

interface Props {
  message: MessageWithUser;
  isFirstInGroup: boolean;
}

export default function ChatMessage({ message, isFirstInGroup }: Props) {
  const isBot = message.sender_username === 'ChatBot';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start space-x-3 ${!isFirstInGroup ? 'mt-1' : 'mt-4'}`}
    >
      {isFirstInGroup ? (
        <div
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-medium text-sm"
          style={{ background: message.sender_avatar_color }}
        >
          {message.sender_username[0].toUpperCase()}
        </div>
      ) : (
        <div className="w-10 flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        {isFirstInGroup && (
          <div className="flex items-baseline space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {message.sender_username}
            </span>
            {isBot && (
              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                BOT
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(message.created_at)}
            </span>
          </div>
        )}

        <div
          className={`inline-block px-4 py-2 rounded-lg ${
            isBot
              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    </motion.div>
  );
}
