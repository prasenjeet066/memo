// utils/getServerAuthContext.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth'; // Update this path as needed
import { ReactNode } from 'react';

type AuthCallback = (isAuth: boolean, data: any) => ReactNode;

export async function getServerAuthContext(callback: AuthCallback): Promise < ReactNode > {
  const session = await getServerSession(authOptions);
  const isAuth = !!session;
  const user = session?.user ?? null;
  
  return callback(isAuth, user);
}