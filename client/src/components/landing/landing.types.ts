import type { ApiCatalogReview } from '../../lib/api'

export type LandingReview = ApiCatalogReview & { courseSubject: string; courseSlug: string }
