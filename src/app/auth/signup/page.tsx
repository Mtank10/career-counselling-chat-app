import { AuthForm } from '@/components/AuthForm';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function SignUp() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <AuthForm mode="signup" />
    </div>
  );
}