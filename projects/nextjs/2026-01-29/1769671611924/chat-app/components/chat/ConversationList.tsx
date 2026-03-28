'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import ScrollArea from '@/components/ui/ScrollArea';
import { cn } from '@/lib/utils/cn';

export interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
}

export interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (conversationId: string) => void;
}

export default function ConversationList({
  conversations,
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  onDeleteConversation,
}: ConversationListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteConversation) return;

    const confirmed = window.confirm('Delete this conversation?');
    if (!confirmed) return;

    setDeletingId(conversationId);
    try {
      await onDeleteConversation(conversationId);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <Button
          onClick={onNewConversation}
          variant="primary"
          className="w-full"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Chat
        </Button>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 p-2">
        {conversations.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onConversationSelect(conversation.id)}
                disabled={deletingId === conversation.id}
                className={cn(
                  'group relative flex w-full flex-col items-start rounded-lg px-3 py-3 text-left transition-colors',
                  currentConversationId === conversation.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100',
                  deletingId === conversation.id && 'opacity-50'
                )}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="flex-1 truncate">
                    <div className="truncate text-sm font-medium">
                      {conversation.title || 'Untitled'}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {formatDate(conversation.updatedAt)}
                    </div>
                  </div>
                  {onDeleteConversation && (
                    <button
                      onClick={(e) => handleDelete(conversation.id, e)}
                      className="opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                      title="Delete conversation"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
