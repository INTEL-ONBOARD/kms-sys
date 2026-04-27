import mongoose from "mongoose";
import { getEnv } from "./env";

// Define the type for the mongoose cache to prevent multiple database connections
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Declare the global mongoose cache variable
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

// Initialize the cache from the global object or create an empty one
const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cache;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  // Return the existing connection if it is already established
  if (cache.conn) {
    return cache.conn;
  }

  // If a connection process is not already started, initialize a new connection
  if (!cache.promise) {
    // Retrieve validated environment variables at runtime, preventing build-time crashes
    const env = getEnv();

    // Establish the mongoose connection using the validated URI
    cache.promise = mongoose.connect(env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB ?? "lms_db",
      bufferCommands: false
    });
  }

  // Wait for the connection promise to resolve and store it in the cache
  cache.conn = await cache.promise;
  return cache.conn;
}