import mongoose from "mongoose";
import config from "../config";
import { logger } from "./logger";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

// Cached on `global` so hot reloads and warm serverless invocations reuse
// one connection pool instead of opening a new one per request.
const cached: MongooseCache = (global.mongooseCache ??= {
  conn: null,
  promise: null,
});

export async function connectDB() {
  if (cached.conn) return cached.conn;

  cached.promise ??= mongoose
    .connect(config.db.uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10_000,
    })
    .then((instance) => {
      instance.connection.on("error", (error) =>
        logger.error("MongoDB connection error", error),
      );
      instance.connection.on("disconnected", () =>
        logger.warn("MongoDB disconnected"),
      );
      return instance;
    });

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
