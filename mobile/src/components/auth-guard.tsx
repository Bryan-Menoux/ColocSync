import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { authClient } from '../lib/auth-client';

const publicPaths = ['/', '/register', '/forgot-password', '/reset-password', '/verify-email', '/verified'];

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [result, setResult] = useState<{
    pathname: string;
    session: Awaited<ReturnType<typeof authClient.getSession>>['data'];
    checked: boolean;
  }>({ pathname: '', session: null, checked: false });

  useEffect(() => {
    let active = true;
    void authClient.getSession({ query: { disableCookieCache: true } }).then(({ data }) => {
      if (active) setResult({ pathname, session: data, checked: true });
    }).catch(() => {
      if (active) setResult({ pathname, session: null, checked: true });
    });
    return () => { active = false; };
  }, [pathname]);

  useEffect(() => {
    if (!result.checked || result.pathname !== pathname) return;
    const session = result.session;
    const user = session?.user;
    if (!user && !publicPaths.includes(pathname)) router.replace('/');
    else if (user && !user.emailVerified && pathname !== '/verify-email' && pathname !== '/verified') router.replace('/verify-email');
    else if (user?.emailVerified && (pathname === '/verify-email' || pathname === '/verified' || pathname === '/' || pathname === '/register')) router.replace('/account');
  }, [pathname, result, router]);

  return result.checked && result.pathname === pathname ? children : null;
}
