import mongoose, { type Document, type Model, Schema, type Types } from 'mongoose'
import { hash, compare } from 'bcryptjs'
import type { Provider } from '../domain/index.js'

export interface SafeUser {
  id: string
  firstName: string
  lastName: string | null
  email: string
  emailVerified: boolean
  avatar: string | null
  provider: Provider
  createdAt: string
}

export interface UserDocument extends Document {
  _id: Types.ObjectId
  firstName: string
  lastName?: string
  email: string
  emailVerified: boolean
  avatar?: string
  provider: Provider
  providerId?: string
  passwordHash?: string
  lastLoggedInAt?: Date
  createdAt: Date
  updatedAt: Date
  comparePassword(candidate: string): Promise<boolean>
}

interface UserModel extends Model<UserDocument> {
  /** Selects the password hash explicitly (it is hidden by default). */
  findByCredentials(email: string): Promise<UserDocument | null>
}

const userSchema = new Schema<UserDocument, UserModel>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    avatar: { type: String, default: null },
    provider: { type: String, enum: ['local', 'github', 'google'], required: true, default: 'local' },
    providerId: { type: String },
    passwordHash: { type: String, select: false },
    lastLoggedInAt: { type: Date },
  },
  { timestamps: true },
)

userSchema.static('findByCredentials', function (email: string) {
  return this.findOne({ email }).select('+passwordHash')
})

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.passwordHash) return false
  return compare(candidate, this.passwordHash)
}

export const User = mongoose.model<UserDocument, UserModel>('User', userSchema)

/** Views the user document as the shape that may leave the API. */
export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, 12)
}

export function toSafeUser(user: UserDocument): SafeUser {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName?.trim() ? user.lastName : null,
    email: user.email,
    emailVerified: user.emailVerified,
    avatar: user.avatar?.length ? user.avatar : null,
    provider: user.provider,
    createdAt: user.createdAt.toISOString(),
  }
}

/** Minimal view used when an oauth provider has already been linked. */
export function toLinkedSafeUser(user: UserDocument): Pick<SafeUser, 'id' | 'email' | 'provider'> {
  return { id: user._id.toString(), email: user.email, provider: user.provider }
}