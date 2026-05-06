import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

// Extending the built-in NextAuth module to include our custom fields
declare module "next-auth" {
  
  // 1. Extend the Session interface
  // This allows us to use session.user.id, session.user.role, etc., without TS errors
  interface Session {
    user: {
      id: string;
      role: string;
      status?: string; // Optional field, as some users might not have a status initially
    } & DefaultSession["user"]; // Keeps the default fields like name, email, and image
  }

  // 2. Extend the User interface
  // This tells TypeScript what fields exist on the User object returned from our database
  interface User extends DefaultUser {
    role: string;
    status?: string;
  }
}

// Extending the JWT module
declare module "next-auth/jwt" {
  
  // 3. Extend the JWT interface
  // This ensures that the token object in our jwt() callback recognizes our custom fields
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    status?: string;
  }
}