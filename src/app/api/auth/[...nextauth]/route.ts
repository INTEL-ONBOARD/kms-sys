import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

// Export the handler for both GET and POST requests along with authOptions for backward compatibility
export { handler as GET, handler as POST, authOptions };