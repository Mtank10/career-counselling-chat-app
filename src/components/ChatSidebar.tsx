'use client';

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, MessageSquare, Briefcase, User, Settings, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  isActive?: boolean;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  activeSessionId?: string;
}

export const ChatSidebar = ({ 
  sessions, 
  onNewChat, 
  onSelectSession, 
  onDeleteSession,
  activeSessionId 
}: ChatSidebarProps) => {
  
   

  useEffect(() => {
    // This effect runs whenever sessions change
  }, [sessions]);

  
  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-ai flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Career AI</h2>
            <p className="text-xs text-white/60">Your Career Counselor</p>
          </div>
        </div>
        
        <Button 
          onClick={onNewChat}
          className="w-full bg-sidebar-primary hover:bg-sidebar-accent text-white border-1"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Conversation
        </Button>
      </div>

      {/* Chat Sessions */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group p-3 rounded-lg transition-colors hover:bg-gray-600 relative",
                activeSessionId === session.id && "bg-sidebar-accent border border-sidebar-ring"
              )}
            >
              <button
                onClick={() => onSelectSession(session.id)}
                className="w-full text-left"
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 mt-0.5 text-white/60 flex-shrink-0 " />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white truncate">
                      {session.title}
                    </p>
                    <p className="text-xs text-white/60 truncate">
                      {session.lastMessage}
                    </p>
                    <p className="text-xs text-sidebar-foreground/40 mt-1">
                      {session.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => onDeleteSession(session.id)}
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-sidebar-foreground/60 hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Separator />
      
      {/* Footer */}
      <div className="p-4 space-y-2">
        <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-sidebar-accent">
          <User className="w-4 h-4 mr-2" />
          Profile
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-sidebar-accent">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
};