'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getRoleHomePath } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!token) {
        router.push('/login');
      } else if (allowedRoles && !allowedRoles.includes(role)) {
        router.push(getRoleHomePath(role));
      }
    }
  }, [token, role, loading, router, allowedRoles]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 dark:border-emerald-500/20 border-t-emerald-500"></div>
          </div>
          <div className="text-sm font-semibold text-slate-400 dark:text-slate-500 tracking-wide animate-pulse">Loading MedAssist AI...</div>
        </div>
      </div>
    );
  }

  if (!token || (allowedRoles && !allowedRoles.includes(role))) {
    return null;
  }

  return children;
}
