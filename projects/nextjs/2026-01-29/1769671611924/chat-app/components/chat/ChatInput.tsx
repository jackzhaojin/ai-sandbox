'use client';

import { ChangeEvent, FormEvent, KeyboardEvent, useRef } from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

export interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onStop?: () => void;
  placeholder?: string;
}

export default function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onStop,
  placeholder = 'Send a message...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  // Submit on Enter, new line on Shift+Enter
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        const form = e.currentTarget.form;
        if (form) {
          form.requestSubmit();
        }
      }
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-4">
      <form onSubmit={onSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className={cn(
              'block w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400',
              'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'max-h-[200px] overflow-y-auto'
            )}
          />
        </div>

        {isLoading && onStop ? (
          <Button
            type="button"
            onClick={onStop}
            variant="danger"
            size="lg"
            className="px-6"
          >
            Stop
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="lg"
            className="px-6"
          >
            Send
          </Button>
        )}
      </form>
      <p className="mt-2 text-xs text-gray-500">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
