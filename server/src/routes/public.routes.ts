import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import {
  renderCourseDetail,
  renderCourseList,
  renderCourseNotFound,
  renderRobots,
  renderSitemap,
} from '../public/render.js'

/* ------------------------------------------------------------------ */
/*  Root-level, server-rendered public surface (not under /api/v1) so   */
/*  the catalogue is crawlable and shareable. nginx routes these paths   */
/*  to the API while everything else stays on the SPA.                   */
/* ------------------------------------------------------------------ */

const router = Router()

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

router.get(
  '/courses',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.parseInt(str(req.query.page) || '1', 10) || 1)
    const html = await renderCourseList({
      q: str(req.query.q).slice(0, 200),
      tag: str(req.query.tag).slice(0, 40),
      level: str(req.query.level).slice(0, 40),
      sort: str(req.query.sort).slice(0, 20),
      page,
      limit: 12,
    })
    res.set('Cache-Control', 'public, max-age=120').type('html').send(html)
  }),
)

router.get(
  '/courses/:slug',
  asyncHandler(async (req, res) => {
    const html = await renderCourseDetail(String(req.params.slug))
    if (!html) {
      res.status(404).set('Cache-Control', 'no-store').type('html').send(renderCourseNotFound())
      return
    }
    res.set('Cache-Control', 'public, max-age=300').type('html').send(html)
  }),
)

/* Keep the old /explore URLs working: permanent redirect to /courses. */
router.get('/explore', (req, res) => {
  const query = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : ''
  res.redirect(301, `/courses${query}`)
})

router.get('/explore/:slug', (req, res) => {
  res.redirect(301, `/courses/${encodeURIComponent(String(req.params.slug))}`)
})

router.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    const xml = await renderSitemap()
    res.set('Cache-Control', 'public, max-age=3600').type('application/xml').send(xml)
  }),
)

router.get('/robots.txt', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=3600').type('text/plain').send(renderRobots())
})

export default router
