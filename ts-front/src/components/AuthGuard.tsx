import type { ReactNode } from 'react';
import { isAuthenticated, isTokenExpired, logout } from '../utils/auth';

interface AuthGuardProps {
  children: ReactNode;
  fallback: ReactNode;
}

/**
 * Authentication guard component that protects routes
 * Shows children if authenticated, fallback if not
 */
export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const isUserAuthenticated = isAuthenticated();
  const tokenExpired = isUserAuthenticated && isTokenExpired();

  // If token is expired, logout and show fallback
  if (tokenExpired) {
    logout();
    return <>{fallback}</>;
  }

  // Show children if authenticated, fallback if not
  return isUserAuthenticated ? <>{children}</> : <>{fallback}</>;
}