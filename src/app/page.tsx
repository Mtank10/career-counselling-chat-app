'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { useChat } from '@/hooks/useChat';

export default function Home() {
  const { data: session, status } = useSession();

  const {
    sessions,
    currentSession,
    isLoading,
    sendMessage,
    createNewSession,
    selectSession,
    // deleteSession,
    currentSessionId
  } = useChat();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        sessions={sessions}
        onNewChat={createNewSession}
        onSelectSession={selectSession}
        // onDeleteSession={deleteSession}
        activeSessionId={currentSessionId}
      />
      <div className="flex-1">
        <ChatInterface
          messages={currentSession?.messages || []}
          onSendMessage={sendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}