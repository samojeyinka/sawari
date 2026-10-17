import type { CreateCatalogPathInput } from '../../src/validators/catalogValidators.js'
import { dataAnalyticsCourse } from './data-analytics.js'
import { digitalMarketingCourse } from './digital-marketing.js'
import { productManagementCourse } from './product-management.js'
import { projectManagementCourse } from './project-management.js'
import { publicSpeakingCourse } from './public-speaking.js'
import { pythonBasicsCourse } from './python-basics.js'
import { sqlFundamentalsCourse } from './sql-fundamentals.js'
import { uiUxDesignCourse } from './ui-ux-design.js'

/* ------------------------------------------------------------------ */
/*  Catalog Courses Registry                                          */
/*  Adding another course later is a small change in one file only:   */
/*  author it in catalog-courses/<slug>.ts and export it here.        */
/* ------------------------------------------------------------------ */

export const catalogCourses: CreateCatalogPathInput[] = [
  sqlFundamentalsCourse,
  publicSpeakingCourse,
  pythonBasicsCourse,
  productManagementCourse,
  projectManagementCourse,
  dataAnalyticsCourse,
  uiUxDesignCourse,
  digitalMarketingCourse,
]

export const catalogCoursesBySlug: Record<string, CreateCatalogPathInput> = {
  [sqlFundamentalsCourse.slug!]: sqlFundamentalsCourse,
  [publicSpeakingCourse.slug!]: publicSpeakingCourse,
  [pythonBasicsCourse.slug!]: pythonBasicsCourse,
  [productManagementCourse.slug!]: productManagementCourse,
  [projectManagementCourse.slug!]: projectManagementCourse,
  [dataAnalyticsCourse.slug!]: dataAnalyticsCourse,
  [uiUxDesignCourse.slug!]: uiUxDesignCourse,
  [digitalMarketingCourse.slug!]: digitalMarketingCourse,
}
