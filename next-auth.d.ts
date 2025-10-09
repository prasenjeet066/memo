import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    image ? : string | null;
    role: string[];
    username: string;
    isEmailVerified: boolean;
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image ? : string | null;
      role: string[];
      username: string;
      isEmailVerified: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role ? : string[];
    username ? : string;
    isEmailVerified ? : boolean;
  }
}