import 'dotenv/config'
import mongoose from 'mongoose'
import { env } from '../src/config/env.js'
import { CatalogPath, type CatalogPathDocument } from '../src/models/CatalogPath.js'
import { buildCatalogSections } from '../src/services/catalog.js'
import { createCatalogPathSchema } from '../src/validators/catalogValidators.js'
import { catalogCourses } from './catalog-courses/index.js'

/* ------------------------------------------------------------------ */
/*  Catalog Seeding Script                                            */
/*                                                                     */
/*  Modes:                                                             */
/*  - Default (create-only): skips existing slugs without modifying.   */
/*  - --update <slug...>: explicitly updates named slugs.             */
/*  - --update-all: explicitly updates all courses in catalog.         */
/*  - --dry-run: validates and reports actions without DB writes.      */
/*                                                                     */
/*  Usage:                                                             */
/*    npx tsx scripts/seed-courses.ts                                  */
/*    npx tsx scripts/seed-courses.ts --dry-run                        */
/*    npx tsx scripts/seed-courses.ts --update sql-fundamentals        */
/*    npx tsx scripts/seed-courses.ts --update-all                     */
/* ------------------------------------------------------------------ */

interface CliOptions {
  dryRun: boolean
  updateAll: boolean
  updateSlugs: Set<string>
}

function parseCliArgs(args: string[]): CliOptions {
  let dryRun = false
  let updateAll = false
  const updateSlugs = new Set<string>()

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--dry-run') {
      dryRun = true
    } else if (arg === '--update-all') {
      updateAll = true
    } else if (arg === '--update') {
      // Gather all following non-flag arguments as slugs
      while (i + 1 < args.length && !args[i + 1]?.startsWith('--')) {
        i++
        updateSlugs.add(args[i]!.trim().toLowerCase())
      }
    }
  }

  return { dryRun, updateAll, updateSlugs }
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2))

  if (options.dryRun) {
    console.log('[seed] running in DRY RUN mode (no database writes will occur)')
  }
  if (options.updateAll) {
    console.log('[seed] update-all mode enabled: existing courses will be updated')
  } else if (options.updateSlugs.size > 0) {
    console.log(`[seed] targeted update mode for slugs: ${Array.from(options.updateSlugs).join(', ')}`)
  } else {
    console.log('[seed] default create-only mode: existing courses will be skipped')
  }

  // 1. Pre-validate every course document with the schema
  console.log(`[seed] validating ${catalogCourses.length} course specification(s)...`)
  for (const raw of catalogCourses) {
    const result = createCatalogPathSchema.safeParse(raw)
    if (!result.success) {
      console.error(`[seed] FATAL: Schema validation failed for "${raw.slug}":`)
      for (const issue of result.error.issues) {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
      }
      process.exit(1)
    }
  }
  console.log('[seed] all course specifications passed schema validation.')

  // 2. Connect to database
  await mongoose.connect(env.MONGODB_URI)
  const host = mongoose.connection.host
  const db = mongoose.connection.name
  console.log(`[seed] connected to database ${host}/${db}`)

  const summary = {
    created: [] as string[],
    updated: [] as string[],
    skipped: [] as string[],
  }

  for (const course of catalogCourses) {
    const slug = course.slug
    if (!slug) {
      console.error('[seed] FATAL: Course is missing an explicit slug.')
      process.exit(1)
    }

    const existing = await CatalogPath.findOne({ slug })

    const shouldUpdate =
      options.updateAll || (options.updateSlugs.size > 0 && options.updateSlugs.has(slug))

    if (existing && !shouldUpdate) {
      // Create-only default: skip existing
      if (options.dryRun) {
        console.log(`[seed:dry-run] would skip (already exists): ${slug}`)
      } else {
        console.log(`[seed] skipped (already exists): ${slug}`)
      }
      summary.skipped.push(slug)
      continue
    }

    if (existing && shouldUpdate) {
      // Opt-in update: preserve section IDs
      const preservedSections = buildCatalogSections(
        course.sections,
        slug,
        existing.sections,
      )

      if (options.dryRun) {
        console.log(`[seed:dry-run] would update: ${slug} (${preservedSections.length} sections)`)
      } else {
        await CatalogPath.updateOne(
          { slug },
          {
            $set: {
              subject: course.subject,
              summary: course.summary,
              goal: course.goal,
              level: course.level,
              tags: course.tags,
              weeklyHours: course.weeklyHours,
              intensity: course.intensity,
              formats: course.formats,
              expectedWeeks: course.expectedWeeks,
              expectedHours: course.expectedHours,
              ogImage: course.ogImage,
              sections: preservedSections,
              published: true,
              updatedAt: new Date(),
            },
          },
          { runValidators: true },
        )
        console.log(`[seed] updated: ${slug} (${preservedSections.length} sections)`)
      }
      summary.updated.push(slug)
      continue
    }

    // Course does not exist: create it
    const newSections = buildCatalogSections(course.sections, slug)

    if (options.dryRun) {
      console.log(`[seed:dry-run] would create: ${slug} (${newSections.length} sections)`)
    } else {
      await CatalogPath.create({
        slug,
        subject: course.subject,
        summary: course.summary,
        goal: course.goal,
        level: course.level,
        tags: course.tags,
        weeklyHours: course.weeklyHours,
        intensity: course.intensity,
        formats: course.formats,
        expectedWeeks: course.expectedWeeks,
        expectedHours: course.expectedHours,
        ogImage: course.ogImage,
        sections: newSections,
        published: true,
        publishedAt: new Date(),
        createdBy: null,
        enrollments: 0,
        reviewsCount: 0,
        reviewsAvg: 0,
      })
      console.log(`[seed] created: ${slug} (${newSections.length} sections)`)
    }
    summary.created.push(slug)
  }

  const publishedCount = await CatalogPath.countDocuments({ published: true })

  console.log('\n[seed] summary:')
  console.log(`  - created: ${summary.created.length} (${summary.created.join(', ') || 'none'})`)
  console.log(`  - updated: ${summary.updated.length} (${summary.updated.join(', ') || 'none'})`)
  console.log(`  - skipped: ${summary.skipped.length} (${summary.skipped.join(', ') || 'none'})`)
  console.log(`  - total published in database: ${publishedCount}`)

  await mongoose.disconnect()
  console.log('[seed] finished successfully.')
}

main().catch(async (error) => {
  console.error('[seed] FATAL ERROR:', error)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
