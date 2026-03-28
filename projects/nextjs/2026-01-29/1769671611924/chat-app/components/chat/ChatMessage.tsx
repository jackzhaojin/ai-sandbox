'use client';

import { cn } from '@/lib/utils/cn';
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'flex w-full gap-3 px-4 py-4',
        isUser && 'bg-white',
        isAssistant && 'bg-gray-50'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white',
            isUser && 'bg-blue-600',
            isAssistant && 'bg-purple-600'
          )}
        >
          {isUser ? 'U' : 'AI'}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {isUser ? 'You' : 'Claude'}
          </span>
        </div>
        <div className="prose prose-sm max-w-none text-gray-800">
          {message.content}
        </div>
      </div>
    </div>
  );
}
