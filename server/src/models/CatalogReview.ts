import mongoose, { type Document, type Model, Schema, type Types } from 'mongoose'

/* ------------------------------------------------------------------ */
/*  Reviews left on a catalog path. One review per learner per path,   */
/*  editable by its author. Aggregated onto CatalogPath counters.      */
/* ------------------------------------------------------------------ */

export interface CatalogReviewDocument extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  catalogPathId: Types.ObjectId
  rating: number
  text: string
  createdAt: Date
  updatedAt: Date
}

interface CatalogReviewModel extends Model<CatalogReviewDocument> {}

const catalogReviewSchema = new Schema<CatalogReviewDocument, CatalogReviewModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    catalogPathId: { type: Schema.Types.ObjectId, ref: 'CatalogPath', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: '', maxlength: 2000 },
  },
  { timestamps: true },
)

catalogReviewSchema.index({ catalogPathId: 1, userId: 1 }, { unique: true })
catalogReviewSchema.index({ catalogPathId: 1, createdAt: -1 })

export const CatalogReview = mongoose.model<CatalogReviewDocument, CatalogReviewModel>(
  'CatalogReview',
  catalogReviewSchema,
)
