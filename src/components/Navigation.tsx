'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export function Navigation() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold text-blue-600">
        Career Counselor
      </Link>
      
      <div className="flex items-center space-x-4">
        {session ? (
          <>
            <div className="flex items-center space-x-2">
              {/* {session.user?.image && (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="h-8 w-8 rounded-full"
                />
              )} */}
              <span className="text-sm text-gray-700">
                Welcome, {session.user?.name}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/signin" className="text-sm text-gray-500 hover:text-gray-700">
              Sign In
            </Link>
            <Link href="/auth/signup" className="text-sm text-gray-500 hover:text-gray-700">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}