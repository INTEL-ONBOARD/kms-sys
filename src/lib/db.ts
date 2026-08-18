import mongoose from "mongoose";
import { getEnv } from "./env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cache;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  // If already connected and ready, return existing connection
  if (mongoose.connection.readyState === 1) {
    cache.conn = mongoose;
    return mongoose;
  }

  // If a connection attempt is in progress, await it
  if (!cache.promise || mongoose.connection.readyState === 0) {
    const env = getEnv();

    cache.promise = mongoose
      .connect(env.MONGODB_URI, {
        dbName: process.env.MONGODB_DB ?? "app_db",
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      })
      .then((m) => {
        cache.conn = m;
        return m;
      })
      .catch((err) => {
        cache.promise = null;
        cache.conn = null;
        throw err;
      });
  }

  try {
    cache.conn = await cache.promise;
  } catch (e) {
    cache.promise = null;
    cache.conn = null;
    throw e;
  }

  return cache.conn;
}