'use client';

import { useState, useCallback } from "react";
import { trpc } from '@/lib/trpc/client';

export const useChat = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState<string | null>(null);
  
  const utils = trpc.useUtils();
  const { data: sessions = [], refetch: refetchSessions, isLoading: isLoadingSessions } = trpc.chat.getSessions.useQuery();
  const { data: currentSession, refetch: refetchSession } = trpc.chat.getSession.useQuery(
    { id: currentSessionId! },
    { enabled: !!currentSessionId }
  );
  
  const createSession = trpc.chat.createSession.useMutation();
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();
  const deleteSession = trpc.chat.deleteSession.useMutation();

  const sendMessage = useCallback(async (content: string) => {
    setError(null);
    
    let sessionId = currentSessionId;
    
    // Create a new session if none exists
    if (!sessionId) {
      try {
        const session = await createSession.mutateAsync({});
        sessionId = session.id;
        setCurrentSessionId(sessionId);
        await refetchSessions();
      } catch (err: any) {
        setError('Failed to create chat session');
        throw err;
      }
    }

    try {
      await sendMessageMutation.mutateAsync({
        sessionId: sessionId!,
        message: content,
      });

      // Refresh the session to get updated messages
      await refetchSession();
      
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      throw err;
    }
  }, [currentSessionId, createSession, sendMessageMutation, refetchSession, refetchSessions]);

  const createNewSession = useCallback(async () => {
    setError(null);
    try {
      const session = await createSession.mutateAsync({});
      setCurrentSessionId(session.id);
      await refetchSessions();
      return session.id;
    } catch (err: any) {
      setError('Failed to create new chat session');
      throw err;
    }
  }, [createSession, refetchSessions]);

  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    setError(null);
  }, []);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    setIsDeletingSession(sessionId);
    try {
      await deleteSession.mutateAsync({ id: sessionId });
      await refetchSessions();
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
    } catch (err: any) {
      setError('Failed to delete chat session');
      throw err;
    } finally {
      setIsDeletingSession(null);
    }
  }, [currentSessionId, deleteSession, refetchSessions]);

  return {
    sessions: sessions?.map(session => ({
      id: session.id,
      title: session.title,
      lastMessage: session.messages[0]?.content || "",
      timestamp: session.updatedAt,
      messages: session.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as "user" | "assistant",
        timestamp: msg.createdAt,
      })),
    })) || [],
    currentSession: currentSession ? {
      id: currentSession.id,
      title: currentSession.title,
      lastMessage: currentSession.messages[currentSession.messages.length - 1]?.content || "",
      timestamp: currentSession.updatedAt,
      messages: currentSession.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as "user" | "assistant",
        timestamp: msg.createdAt,
      })),
    } : null,
    isLoading: sendMessageMutation.isPending || createSession.isPending,
    isLoadingSessions,
    isDeletingSession,
    isCreatingSession: createSession.isPending,
    error,
    sendMessage,
    createNewSession,
    selectSession,
    deleteSession: handleDeleteSession,
    currentSessionId,
    clearError: () => setError(null),
  };
};