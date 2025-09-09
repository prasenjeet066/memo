// lib/auth.ts
import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google'; // example

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // Add session/callbacks as needed
  
};