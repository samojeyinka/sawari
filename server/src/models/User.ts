import mongoose, { type Document, type Model, Schema, type Types } from 'mongoose'
import { hash, compare } from 'bcryptjs'
import { INTENSITIES, LEARNING_FORMATS, REMINDER_DAYS, WEEKLY_HOURS, type Intensity, type LearningFormat, type Provider, type ReminderDay, type WeeklyHours } from '../domain/index.js'

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

/** Notification/scheduling preferences, editable from Settings. */
export interface ReminderPreferences {
  dailyReminder: boolean
  weeklySummary: boolean
  /** IANA zone, e.g. "Europe/London". */
  timezone: string
  /** Local delivery time, 24h "HH:MM". */
  reminderTime: string
  /** Which local weekdays receive the daily reminder. */
  reminderDays: ReminderDay[]
  /** Remind even on rest days. */
  restDay: boolean
  projectFeedback: boolean
  pathUpdates: boolean
  productNews: boolean
  /** Learning plan shaping (mirrors the client setup answers). */
  weeklyHours: WeeklyHours
  intensity: Intensity
  formats: LearningFormat[]
  /** Default session length in minutes. */
  sessionLength: number
}

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  dailyReminder: true,
  weeklySummary: true,
  timezone: 'UTC',
  reminderTime: '19:00',
  reminderDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  restDay: true,
  projectFeedback: true,
  pathUpdates: true,
  productNews: false,
  weeklyHours: '5',
  intensity: 'balanced',
  formats: ['articles', 'exercises', 'projects', 'quizzes'],
  sessionLength: 45,
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
  preferences?: ReminderPreferences
  /** Verification fields */
  emailVerificationCode?: string
  emailVerificationExpiresAt?: Date
  /** Password reset fields (token is stored hashed, never in the clear). */
  passwordResetToken?: string
  passwordResetExpiresAt?: Date
  /** Billing: free users are capped, pro (one-time PayPal) unlocks more. */
  plan: 'free' | 'pro'
  proPaidAt?: Date | null
  paypalOrderId?: string | null
  paypalCaptureId?: string | null
  /** User-supplied DeepSeek key (AES-256-GCM sealed; also unlocks more). */
  aiKeySealed?: string | null
  aiKeyLast4?: string | null
  aiKeyVerifiedAt?: Date | null
  /** Idempotency guards for the scheduler (never serialized). */
  reminderLastSentAt?: Date | null
  summaryLastSentAt?: Date | null
  createdAt: Date
  updatedAt: Date
  comparePassword(candidate: string): Promise<boolean>
}

interface UserModel extends Model<UserDocument> {
  /** Selects the password hash explicitly (it is hidden by default). */
  findByCredentials(email: string): Promise<UserDocument | null>
}

const preferencesSchema = new Schema<ReminderPreferences>(
  {
    dailyReminder: { type: Boolean, default: DEFAULT_REMINDER_PREFERENCES.dailyReminder },
    weeklySummary: { type: Boolean, default: DEFAULT_REMINDER_PREFERENCES.weeklySummary },
    timezone: { type: String, default: DEFAULT_REMINDER_PREFERENCES.timezone, maxlength: 60 },
    reminderTime: {
      type: String,
      default: DEFAULT_REMINDER_PREFERENCES.reminderTime,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    reminderDays: {
      type: [String],
      enum: REMINDER_DAYS,
      default: () => [...DEFAULT_REMINDER_PREFERENCES.reminderDays],
    },
    restDay: { type: Boolean, default: DEFAULT_REMINDER_PREFERENCES.restDay },
    projectFeedback: { type: Boolean, default: DEFAULT_REMINDER_PREFERENCES.projectFeedback },
    pathUpdates: { type: Boolean, default: DEFAULT_REMINDER_PREFERENCES.pathUpdates },
    productNews: { type: Boolean, default: DEFAULT_REMINDER_PREFERENCES.productNews },
    weeklyHours: {
      type: String,
      enum: WEEKLY_HOURS,
      default: DEFAULT_REMINDER_PREFERENCES.weeklyHours,
    },
    intensity: {
      type: String,
      enum: INTENSITIES,
      default: DEFAULT_REMINDER_PREFERENCES.intensity,
    },
    formats: {
      type: [String],
      enum: LEARNING_FORMATS,
      default: () => [...DEFAULT_REMINDER_PREFERENCES.formats],
    },
    sessionLength: {
      type: Number,
      default: DEFAULT_REMINDER_PREFERENCES.sessionLength,
      min: 5,
      max: 240,
    },
  },
  { _id: false },
)

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
    emailVerificationCode: { type: String, select: false },
    emailVerificationExpiresAt: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    plan: { type: String, enum: ['free', 'pro'], default: 'free', index: true },
    proPaidAt: { type: Date, default: null },
    paypalOrderId: { type: String, default: null },
    paypalCaptureId: { type: String, default: null, index: true },
    aiKeySealed: { type: String, select: false, default: null },
    aiKeyLast4: { type: String, default: null },
    aiKeyVerifiedAt: { type: Date, default: null },
    avatar: { type: String, default: null },
    provider: { type: String, enum: ['local', 'github', 'google'], required: true, default: 'local' },
    providerId: { type: String },
    passwordHash: { type: String, select: false },
    lastLoggedInAt: { type: Date },
    preferences: { type: preferencesSchema, default: () => ({}) },
    reminderLastSentAt: { type: Date, default: null },
    summaryLastSentAt: { type: Date, default: null },
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

/** Merges stored preferences over the defaults, so old docs read sanely. */
export function toReminderPreferences(user: {
  preferences?: Partial<ReminderPreferences> | null
}): ReminderPreferences {
  const prefs = user.preferences
  return {
    dailyReminder: prefs?.dailyReminder ?? DEFAULT_REMINDER_PREFERENCES.dailyReminder,
    weeklySummary: prefs?.weeklySummary ?? DEFAULT_REMINDER_PREFERENCES.weeklySummary,
    timezone: prefs?.timezone ?? DEFAULT_REMINDER_PREFERENCES.timezone,
    reminderTime: prefs?.reminderTime ?? DEFAULT_REMINDER_PREFERENCES.reminderTime,
    reminderDays: prefs?.reminderDays?.length
      ? [...prefs.reminderDays]
      : [...DEFAULT_REMINDER_PREFERENCES.reminderDays],
    restDay: prefs?.restDay ?? DEFAULT_REMINDER_PREFERENCES.restDay,
    projectFeedback: prefs?.projectFeedback ?? DEFAULT_REMINDER_PREFERENCES.projectFeedback,
    pathUpdates: prefs?.pathUpdates ?? DEFAULT_REMINDER_PREFERENCES.pathUpdates,
    productNews: prefs?.productNews ?? DEFAULT_REMINDER_PREFERENCES.productNews,
    weeklyHours: prefs?.weeklyHours ?? DEFAULT_REMINDER_PREFERENCES.weeklyHours,
    intensity: prefs?.intensity ?? DEFAULT_REMINDER_PREFERENCES.intensity,
    formats: prefs?.formats?.length
      ? [...prefs.formats]
      : [...DEFAULT_REMINDER_PREFERENCES.formats],
    sessionLength: prefs?.sessionLength ?? DEFAULT_REMINDER_PREFERENCES.sessionLength,
  }
}