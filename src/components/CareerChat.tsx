'use client';

import { FormEvent, useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export default function CareerChat() {
  const [message, setMessage] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  // tRPC queries and mutations
  const utils = trpc.useUtils();
  const { data: sessions, refetch: refetchSessions } = trpc.chat.getSessions.useQuery({}, {
    enabled: !!session,
  });
  const { data: currentSession, refetch: refetchSession } = trpc.chat.getSession.useQuery(
    { id: currentSessionId! },
    { enabled: !!currentSessionId && !!session }
  );
  const createSession = trpc.chat.createSession.useMutation();
  const sendMessage = trpc.chat.sendMessage.useMutation();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Set the first session as current if none is selected
  useEffect(() => {
    if (sessions && sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, currentSessionId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !session) return;

    setIsLoading(true);
    
    try {
      let sessionId = currentSessionId;
      
      // Create a new session if none exists
      if (!sessionId) {
        const session = await createSession.mutateAsync({});
        sessionId = session.id;
        setCurrentSessionId(sessionId);
        await refetchSessions();
      }

      // Send message to the server
      await sendMessage.mutateAsync({
        sessionId: sessionId!,
        message: message.trim(),
      });

      // Refresh the session to get updated messages
      await refetchSession();
      
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = async () => {
    setCurrentSessionId(null);
    setMessage('');
  };

  

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar with chat sessions */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Career Counselor</h1>
          <p className="text-sm text-gray-500">AI-powered career guidance</p>
        </div>
        
        <div className="p-4">
          <button 
            onClick={startNewChat}
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Recent Chats
          </div>
          
          {sessions?.length === 0 && (
            <div className="px-4 py-2 text-sm text-gray-500">
              No chats yet. Start a new conversation!
            </div>
          )}
          
          {sessions?.map(session => (
            <div
              key={session.id}
              className={`p-3 border-b border-gray-100 cursor-pointer group relative ${
                session.id === currentSessionId 
                  ? 'bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setCurrentSessionId(session.id)}
            >
              <div className="font-medium text-gray-800 truncate">
                {session.title}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {session.messages[0]?.content || 'New conversation'}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(session.createdAt).toLocaleDateString()}
              </div>
              
              
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-200 text-xs text-center text-gray-500">
          Powered by Hugging Face AI
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {currentSessionId ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              {currentSession?.messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Start a conversation</h3>
                    <p className="mt-2 text-gray-500">
                      Ask about career paths, job search strategies, skill development, or any career-related topic.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {currentSession?.messages.map((msg: Message) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3/4 rounded-lg p-4 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="font-medium capitalize mb-1">
                        {msg.role === 'user' ? 'You' : 'Career Counselor'}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-3/4 rounded-lg p-4 bg-gray-100 text-gray-800">
                      <div className="font-medium mb-1">Career Counselor</div>
                      <div className="flex items-center">
                        <div className="animate-pulse">Thinking...</div>
                        <div className="flex ml-2 space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden">
                <input
                  placeholder="Ask about your career goals, skills, or job search..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 p-3 border-0 focus:ring-0"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className="p-3 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Press Enter to send. Career Counselor is powered by Hugging Face AI.
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center max-w-md p-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Career Counseling Chat</h2>
              <p className="mt-2 text-gray-600">
                Start a conversation with our AI career counselor to get personalized advice on your career path, job search, and professional development.
              </p>
              <button
                onClick={startNewChat}
                className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
              >
                Start New Conversation
              </button>
              <div className="mt-6 text-sm text-gray-500">
                <p>Examples of what you can ask:</p>
                <ul className="mt-2 space-y-1">
                  <li>• How can I transition to a tech career?</li>
                  <li>• What skills are in demand for marketing roles?</li>
                  <li>• How should I prepare for a job interview?</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}