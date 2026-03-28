'use client';

import { useState, useEffect } from 'react';
import ConversationList, { Conversation } from './ConversationList';
import ChatInterface from './ChatInterface';
import Header from '@/components/layout/Header';

export interface ChatLayoutProps {
  userName?: string | null;
  userEmail?: string | null;
}

export default function ChatLayout({ userName, userEmail }: ChatLayoutProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const result = await response.json();
        setConversations(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' }),
      });

      if (response.ok) {
        const result = await response.json();
        setConversations([result.data, ...conversations]);
        setCurrentConversationId(result.data.id);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations(conversations.filter((c) => c.id !== conversationId));
        if (currentConversationId === conversationId) {
          setCurrentConversationId(undefined);
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleConversationCreated = (conversationId: string) => {
    // Set the new conversation as current
    setCurrentConversationId(conversationId);
    // Reload conversations to get the new one in the list
    loadConversations();
  };

  return (
    <div className="flex h-screen flex-col">
      <Header userName={userName} userEmail={userEmail} />
      <div className="flex flex-1 overflow-hidden">
        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversationId}
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
        />
        <div className="flex-1">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : (
            <ChatInterface
              conversationId={currentConversationId}
              onConversationCreated={handleConversationCreated}
            />
          )}
        </div>
      </div>
    </div>
  );
}
