'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requireAuth = false,
  requireAdmin = false,
  redirectTo = '/auth',
  fallback
}: AuthGuardProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      setIsChecking(false);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && !isChecking) {
      // Check authentication requirement
      if (requireAuth && !user) {
        const currentPath = window.location.pathname;
        const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
        router.push(redirectUrl);
        return;
      }

      // Check admin requirement
      if (requireAdmin && (!user || userProfile?.role !== 'admin')) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [user, userProfile, loading, isChecking, requireAuth, requireAdmin, redirectTo, router]);

  // Show loading state
  if (loading || isChecking) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Doğrulanıyor...</h2>
          <p className="text-muted-foreground">Lütfen bekleyin.</p>
        </div>
      </div>
    );
  }

  // Check auth requirements
  if (requireAuth && !user) {
    return null; // Will redirect via useEffect
  }

  if (requireAdmin && (!user || userProfile?.role !== 'admin')) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}

// Higher-order component version
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthGuardProps, 'children'> = {}
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

// Specific guard components for common use cases
export function RequireAuth({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard requireAuth fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

export function RequireAdmin({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard requireAuth requireAdmin fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

// Hook for conditional rendering based on auth state
export function useAuthGuard() {
  const { user, userProfile, loading } = useAuth();

  return {
    isAuthenticated: !!user,
    isAdmin: user && userProfile?.role === 'admin',
    isLoading: loading,
    user,
    userProfile,
  };
}
