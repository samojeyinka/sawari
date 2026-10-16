import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import {
  renderExploreDetail,
  renderExploreList,
  renderExploreNotFound,
  renderRobots,
  renderSitemap,
} from '../public/render.js'

/* ------------------------------------------------------------------ */
/*  Root-level, server-rendered public surface (not under /api/v1) so   */
/*  the catalog is crawlable and shareable. nginx routes these paths to  */
/*  the API while everything else stays on the SPA.                     */
/* ------------------------------------------------------------------ */

const router = Router()

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

router.get(
  '/explore',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.parseInt(str(req.query.page) || '1', 10) || 1)
    const html = await renderExploreList({
      q: str(req.query.q).slice(0, 200),
      tag: str(req.query.tag).slice(0, 40),
      level: str(req.query.level).slice(0, 40),
      page,
      limit: 12,
    })
    res.set('Cache-Control', 'public, max-age=120').type('html').send(html)
  }),
)

router.get(
  '/explore/:slug',
  asyncHandler(async (req, res) => {
    const html = await renderExploreDetail(String(req.params.slug))
    if (!html) {
      res.status(404).set('Cache-Control', 'no-store').type('html').send(renderExploreNotFound())
      return
    }
    res.set('Cache-Control', 'public, max-age=300').type('html').send(html)
  }),
)

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
