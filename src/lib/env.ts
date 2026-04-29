import { z } from "zod";

// 1. Define all required environment variables
const envSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is completely missing!"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is completely missing!"),
  // Add any other required environment variables here
});

// 2. This function checks the variables during runtime
export const getEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid Environment Variables:", parsed.error.format());
    // Throws a clear error at the runtime boundary
    throw new Error("Missing or invalid environment variables at runtime.");
  }

  return parsed.data;
};