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

  const createNewSession = useCallback(async () => {
    const session = await createSession.mutateAsync({});
    setCurrentSessionId(session.id);
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

    await sendMessageMutation.mutateAsync({
      sessionId: sessionId!,
      message: content,
    });

    // Refresh the session to get updated messages
    await refetchSession();
  }, [currentSessionId, createNewSession, sendMessageMutation, refetchSession]);

  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await deleteSession.mutateAsync({ id: sessionId });
    await refetchSessions();
    
    // If we're deleting the current session, clear it
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId, deleteSession, refetchSessions]);

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
      messages: currentSession.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as "user" | "assistant",
        timestamp: msg.created_at,
      })),
    } : null,
    isLoading: sendMessageMutation.isPending,
    sendMessage,
    createNewSession,
    selectSession,
    deleteSession: handleDeleteSession,
    currentSessionId,
  };
};