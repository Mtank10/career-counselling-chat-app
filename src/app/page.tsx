'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import CareerChat from '@/components/CareerChat';
import { Navigation } from '@/components/Navigation';

export default function Home() {
  const { data: session, status } = useSession();

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
    <div className="h-screen flex flex-col">
      <Navigation />
      <CareerChat />
    </div>
  );
}