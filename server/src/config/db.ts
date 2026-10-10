import mongoose from 'mongoose'
import { env } from './env.js'

/* ------------------------------------------------------------------ */
/*  Database: single source of truth for connection lifecycle.         */
/*  The app boots only after a successful connect (fail fast).         */
/* ------------------------------------------------------------------ */

export async function connectDb(uri = env.MONGODB_URI): Promise<void> {
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 10,
    minPoolSize: 1,
  })
}

export async function disconnectDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1
}