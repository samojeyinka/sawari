import mongoose, { type Document, type Model, Schema, type Types } from 'mongoose'

export interface CertificateDocument extends Document {
  _id: Types.ObjectId
  credentialId: string
  userId: Types.ObjectId
  catalogPathId: Types.ObjectId
  recipientName: string
  courseSubject: string
  courseSlug: string
  sectionsCount: number
  hoursCount: number
  level: string
  archivalHash: string
  issuedAt: Date
  emailSentAt: Date | null
  createdAt: Date
  updatedAt: Date
}

interface CertificateModel extends Model<CertificateDocument> {}

const certificateSchema = new Schema<CertificateDocument>(
  {
    credentialId: { type: String, required: true, unique: true, index: true, uppercase: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    catalogPathId: { type: Schema.Types.ObjectId, ref: 'CatalogPath', required: true, index: true },
    recipientName: { type: String, required: true, trim: true },
    courseSubject: { type: String, required: true, trim: true },
    courseSlug: { type: String, required: true, trim: true, index: true },
    sectionsCount: { type: Number, required: true, default: 0 },
    hoursCount: { type: Number, required: true, default: 0 },
    level: { type: String, required: true, default: 'all-levels' },
    archivalHash: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
    emailSentAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
)

certificateSchema.index({ userId: 1, catalogPathId: 1 }, { unique: true })

export const Certificate: CertificateModel =
  (mongoose.models.Certificate as CertificateModel) ||
  mongoose.model<CertificateDocument, CertificateModel>('Certificate', certificateSchema)
