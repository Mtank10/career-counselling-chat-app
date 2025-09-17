'use client';

import { useState, useCallback } from "react";
import { trpc } from '@/lib/trpc/client';

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastMessage: string;
  timestamp: Date;
}

export const useChat = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // tRPC queries and mutations
  const utils = trpc.useUtils();
  const { data: sessions = [], refetch: refetchSessions } = trpc.chat.getSessions.useQuery();
  const { data: currentSession, refetch: refetchSession } = trpc.chat.getSession.useQuery(
    { id: currentSessionId! },
    { enabled: !!currentSessionId }
  );
  const createSession = trpc.chat.createSession.useMutation();
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();
   const deleteSession = trpc.chat.deleteSession.useMutation();

  // Clear optimistic messages when session changes
  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    setOptimisticMessages([]);
    setIsStreaming(false);
  }, []);
  const createNewSession = useCallback(async () => {
    const session = await createSession.mutateAsync({});
    setCurrentSessionId(session.id);
    setOptimisticMessages([]);
    setIsStreaming(false);
    await refetchSessions();
    return session.id;
  }, [createSession, refetchSessions]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    let sessionId = currentSessionId;
    
    // Create a new session if none exists
    if (!sessionId) {
      sessionId = await createNewSession();
    }

    // Add user message immediately (optimistic update)
    const userMessage: Message = {
      id: `temp-user-${Date.now()}`,
      content,
      role: "user",
      timestamp: new Date(),
    };

    // Add AI typing indicator
    const aiTypingMessage: Message = {
      id: `temp-ai-${Date.now()}`,
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isStreaming: true,
    };

    setOptimisticMessages([userMessage, aiTypingMessage]);
    setIsStreaming(true);
    try {
      await sendMessageMutation.mutateAsync({
        sessionId: sessionId!,
        message: content,
      });

      // Clear optimistic messages and refresh
      setOptimisticMessages([]);
      setIsStreaming(false);
      await refetchSession();
      await refetchSessions(); // Update sidebar titles
    } catch (error) {
      // Remove optimistic messages on error
      setOptimisticMessages([]);
      setIsStreaming(false);
      console.error('Failed to send message:', error);
    }
  }, [currentSessionId, createNewSession, sendMessageMutation, refetchSession]);


  const handleDeleteSession = useCallback(async (sessionId: string) => {
    // Optimistic update - remove from UI immediately
    await utils.chat.getSessions.cancel();
    const previousSessions = utils.chat.getSessions.getData() ?? [];
    
    // Update cache optimistically
    utils.chat.getSessions.setData(undefined, (old) => 
      old?.filter(session => session.id !== sessionId) ?? []
    );

    try {
      await deleteSession.mutateAsync({ id: sessionId });
      
      // If we're deleting the current session, clear it
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setOptimisticMessages([]);
        setIsStreaming(false);
      }
    } catch (error) {
      // Revert optimistic update on error
      utils.chat.getSessions.setData(undefined, previousSessions);
      console.error('Failed to delete session:', error);
    }
  }, [currentSessionId, deleteSession, refetchSessions]);

  // Combine real messages with optimistic messages
  const getCurrentMessages = useCallback(() => {
    const realMessages = currentSession?.messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      role: msg.role as "user" | "assistant",
      timestamp: msg.created_at,
    })) || [];
    
    return [...realMessages, ...optimisticMessages];
  }, [currentSession, optimisticMessages]);
  return {
    sessions: sessions.map(session => ({
      id: session.id,
      title: session.title,
      lastMessage: session.messages[0]?.content || "",
      timestamp: session.updated_at,
      messages: session.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as "user" | "assistant",
        timestamp: msg.created_at,
      })),
    })),
    currentSession: currentSession ? {
      id: currentSession.id,
      title: currentSession.title,
      lastMessage: currentSession.messages[currentSession.messages.length - 1]?.content || "",
      timestamp: currentSession.updated_at,
      messages: getCurrentMessages(),
    } : null,
    isLoading: sendMessageMutation.isPending || isStreaming,
    sendMessage,
    createNewSession,
    selectSession,
    deleteSession: handleDeleteSession,
    currentSessionId,
  };
};