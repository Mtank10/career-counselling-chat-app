'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Sparkles, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

const starterPrompts = [
  {
    title: "Career Path Planning",
    description: "Help me plan my career trajectory",
    gradient: "bg-gradient-career",
    icon: "🎯"
  },
  {
    title: "Skill Development",
    description: "What skills should I develop next?",
    gradient: "bg-gradient-ai",
    icon: "📚"
  },
  {
    title: "Interview Preparation",
    description: "Prepare me for upcoming interviews",
    gradient: "bg-gradient-success",
    icon: "💼"
  }
];

export const ChatInterface = ({ messages, onSendMessage, isLoading }: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStarterPrompt = (prompt: string) => {
    onSendMessage(prompt);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {isEmpty && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-ai flex items-center justify-center shadow-ai-glow">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-300 mb-2">
              How can I help with your career?
            </h1>
            <p className="text-muted-foreground text-lg">
              Welcome to your AI career counselor. Lets discuss your professional journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
            {starterPrompts.map((prompt, index) => (
              <Card
                key={index}
                className={cn(
                  "p-6 cursor-pointer transition-all duration-300 hover:scale-105 border-border hover:shadow-lg",
                  prompt.gradient
                )}
                onClick={() => handleStarterPrompt(prompt.description)}
              >
                <div className="text-3xl mb-3">{prompt.icon}</div>
                <h3 className="font-semibold text-white mb-2">{prompt.title}</h3>
                <p className="text-white/80 text-sm">{prompt.description}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!isEmpty && (
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-ai text-white">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-chat-user text-white"
                      : "bg-card border border-border"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <span className={cn(
                    "text-xs mt-2 block",
                    message.role === "user" ? "text-white/70" : "text-muted-foreground"
                  )}>
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>

                {message.role === "user" && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-muted">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-ai text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-card border border-border rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your career goals, skills, or job search..."
                className="pr-12 bg-input border-border focus:border-ring"
                disabled={isLoading}
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-1 top-1 h-8 w-8 p-0 bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            AI career counselor can make mistakes. Please verify important information.
          </p>
        </div>
      </div>
    </div>
  );
};