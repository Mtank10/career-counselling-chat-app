'use client';

import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { TRPCReactProvider } from '@/lib/trpc/react';
import { TooltipProvider } from '@/components/ui/tooltip';

import { Toaster as Sonner } from '@/components/ui/sonner';

export function Providers({ 
  children, 
  session 
}: { 
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <TRPCReactProvider>
        <TooltipProvider>
          {children}
          <Sonner />
        </TooltipProvider>
      </TRPCReactProvider>
    </SessionProvider>
  );
}