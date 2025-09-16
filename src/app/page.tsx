'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { useChat } from '@/hooks/useChat';

export default function Home() {
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const {
    sessions,
    currentSession,
    isLoading,
    sendMessage,
    createNewSession,
    selectSession,
    deleteSession,
    currentSessionId
  } = useChat();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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
        onDeleteSession={deleteSession}
        activeSessionId={currentSessionId}
        isMobileOpen={isSidebarOpen}
        onMobileToggle={toggleSidebar}
      />
      
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <div className="flex-1">
        <ChatInterface
          messages={currentSession?.messages || []}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          onOpenSidebar={toggleSidebar}
        />
      </div>
    </div>
  );
}