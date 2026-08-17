import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

// Extending the built-in NextAuth module to include our custom fields
declare module "next-auth" {
  
  // 1. Extend the Session interface
  // This allows us to use session.user.id, session.user.role, etc., without TS errors
  interface Session {
    user: {
      id: string;
      role: string;
      status?: string;
      department?: string;
      expertise?: string;
      qualification?: string;
      linkedin?: string;
    } & DefaultSession["user"];
  }

  // 2. Extend the User interface
  interface User extends DefaultUser {
    role: string;
    status?: string;
    department?: string;
    expertise?: string;
    qualification?: string;
    linkedin?: string;
  }
}

// Extending the JWT module
declare module "next-auth/jwt" {
  
  // 3. Extend the JWT interface
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    status?: string;
    department?: string;
    expertise?: string;
    qualification?: string;
    linkedin?: string;
  }
}