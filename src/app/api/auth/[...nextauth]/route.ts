import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 1. Check if email and password are provided
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        // 2. Connect to the database
        await connectToDatabase();

        // 3. Find the user by email
        const user = await User.findOne({ email: credentials.email });

        // If user doesn't exist, return a generic error for security
        if (!user) {
          throw new Error("Invalid email or password.");
        }

        // 4. Compare the entered password with the hashed password in the database
        if (!user.password) {
          throw new Error("Please activate your account and set a password first.");
        }

        const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordMatch) {
          throw new Error("Invalid email or password.");
        }

        // 5. Check if the account is activated via the email link
        if (!user.isActivated) {
          throw new Error("Please activate your account first. Check your email for the activation link.");
        }

        // 6. Check if the user account is active based on the LMS specification
        if (user.status && user.status !== 'active') {
          throw new Error("Your account is not active. Please contact support.");
        }

        // 7. Return user object (this will be saved in the NextAuth JWT token)
        // Thanks to next-auth.d.ts, TypeScript knows 'role' and 'status' are valid here
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,     // Passing role to token
          status: user.status, // Passing status to token
        };
      }
    })
  ],
  callbacks: {
    // This callback is called whenever a JWT is created or updated
    async jwt({ token, user }) {
      // If the user object exists (e.g., immediately after logging in)
      if (user) {
        // We no longer need 'as any' because we defined these types globally
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    // This callback is called whenever a session is checked on the client side
    async session({ session, token }) {
      // Pass the token values to the session user object
      if (token && session.user) {
        // We no longer need 'as any' because we defined these types globally
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login", // Using custom login page
  },
  session: {
    strategy: "jwt", // Use JSON Web Tokens for session management
  },
  secret: process.env.JWT_SECRET, // The secret key from your .env file
};

const handler = NextAuth(authOptions);

// Export the handler for both GET and POST requests
export { handler as GET, handler as POST };