'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Loading from '@/app/loading';

interface RequireAuthProps {
  children: ReactNode;
  redirectTo?: string;
}

export function RequireAuth({ children, redirectTo = '/auth' }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Loading />;
  }

  return <>{children}</>;
}
