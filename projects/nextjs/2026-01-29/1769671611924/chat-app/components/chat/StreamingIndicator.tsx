'use client';

import { cn } from '@/lib/utils/cn';

export interface StreamingIndicatorProps {
  className?: string;
}

export default function StreamingIndicator({ className }: StreamingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-4 bg-gray-50', className)}>
      <div className="flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-medium text-white">
          AI
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Claude</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <span className="animate-bounce inline-block h-2 w-2 rounded-full bg-purple-600" style={{ animationDelay: '0ms' }} />
            <span className="animate-bounce inline-block h-2 w-2 rounded-full bg-purple-600" style={{ animationDelay: '150ms' }} />
            <span className="animate-bounce inline-block h-2 w-2 rounded-full bg-purple-600" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="ml-2 text-sm text-gray-500">Thinking...</span>
        </div>
      </div>
    </div>
  );
}
