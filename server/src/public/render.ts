import { env } from '../config/env.js'
import { CatalogPath } from '../models/CatalogPath.js'
import { CatalogReview } from '../models/CatalogReview.js'
import type { LessonBlock, SessionContent } from '../models/SessionContent.js'

/* ------------------------------------------------------------------ */
/*  Server-rendered public catalog surface. These pages exist so the    */
/*  catalog is crawlable and shareable without an account. They are     */
/*  read-only: enrolling and reviewing happen in the authenticated app. */
/* ------------------------------------------------------------------ */

const SITE_NAME = 'Sawari'
const SITE_BASE = env.FRONTEND_URL.replace(/\/$/, '')

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** App-internal URL the CTAs point at; the SPA gates it behind login. */
function appUrl(path: string): string {
  return `${SITE_BASE}/app${path}`
}

/** Top-level action URL the SPA owns; it gates behind login then acts. */
function actionUrl(path: string): string {
  return `${SITE_BASE}${path}`
}

interface PageMeta {
  title: string
  description: string
  canonical: string
  ogImage?: string | null
  jsonLd?: object
  noindex?: boolean
}

const STYLES = `
  :root{--ink:#17181c;--body:#55575e;--muted:#83858d;--line:#e8e6e1;--canvas:#faf9f7;--accent:#0f766e;--accent-strong:#0b5f59;--accent-soft:#e7f2f0}
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{margin:0;background:var(--canvas);color:var(--ink);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  a{color:inherit}
  .wrap{max-width:880px;margin:0 auto;padding:0 20px}
  header.site{border-bottom:1px solid var(--line);background:#fff}
  header.site .wrap{display:flex;align-items:center;justify-content:space-between;height:64px}
  .brand{font-weight:700;letter-spacing:-.01em;text-decoration:none;font-size:18px}
  .brand span{color:var(--accent)}
  .nav a{color:var(--body);text-decoration:none;margin-left:20px;font-size:15px}
  .nav a:hover{color:var(--accent-strong)}
  main{padding:40px 0 72px}
  h1{font-size:clamp(28px,4vw,40px);line-height:1.15;letter-spacing:-.02em;margin:0 0 12px}
  h2{font-size:22px;letter-spacing:-.01em;margin:40px 0 12px}
  h3{font-size:17px;margin:24px 0 6px}
  p{margin:0 0 14px}
  .lede{font-size:18px;color:var(--body);max-width:60ch}
  .crumbs{font-size:14px;color:var(--muted);margin-bottom:18px}
  .crumbs a{color:var(--muted);text-decoration:none}
  .crumbs a:hover{color:var(--accent-strong)}
  .chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}
  .chip{font-size:13px;color:var(--accent-strong);background:var(--accent-soft);border-radius:999px;padding:4px 12px;text-decoration:none}
  .meta-row{display:flex;flex-wrap:wrap;gap:8px 20px;color:var(--muted);font-size:14px;margin:8px 0 4px}
  .grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));margin-top:28px}
  .card{display:block;background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px;text-decoration:none;transition:border-color .15s,transform .15s}
  .card:hover{border-color:#c9c6bf;transform:translateY(-2px)}
  .card h3{margin:0 0 8px;font-size:18px}
  .card p{color:var(--body);font-size:14px;margin:0 0 14px}
  .search{display:flex;gap:8px;margin-top:24px;flex-wrap:wrap}
  .search input{flex:1;min-width:200px;padding:11px 14px;border:1px solid var(--line);border-radius:10px;font-size:15px;background:#fff}
  .search button{padding:11px 20px;border:0;border-radius:10px;background:var(--accent);color:#fff;font-weight:600;font-size:15px;cursor:pointer}
  .search button:hover{background:var(--accent-strong)}
  .cta{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;font-weight:600;padding:13px 22px;border-radius:10px;margin-top:8px}
  .cta:hover{background:var(--accent-strong)}
  .cta.ghost{background:#fff;border:1px solid var(--line);color:var(--ink)}
  .actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}
  .section{border:1px solid var(--line);background:#fff;border-radius:14px;padding:22px;margin:14px 0}
  .section .mins{font-size:13px;color:var(--muted)}
  .section ul{margin:10px 0 0;padding-left:22px}
  .section li{margin:4px 0}
  .note{background:var(--accent-soft);border-radius:10px;padding:12px 16px;margin:12px 0}
  .note strong{display:block;margin-bottom:4px}
  .resource{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-top:1px solid var(--line);font-size:14px}
  .resource:first-of-type{border-top:0}
  .review{border-top:1px solid var(--line);padding:14px 0}
  .review .who{font-weight:600}
  .stars{color:#e8a15c;letter-spacing:2px}
  .empty{color:var(--muted);padding:48px 0;text-align:center}
  .pager{display:flex;justify-content:space-between;margin-top:32px;font-size:14px}
  .pager a{color:var(--accent-strong);text-decoration:none}
  footer.site{border-top:1px solid var(--line);color:var(--muted);font-size:14px;padding:28px 0}
  footer.site a{color:var(--muted);text-decoration:none;margin-right:16px}
  footer.site a:hover{color:var(--accent-strong)}
`

function page(meta: PageMeta, inner: string): string {
  const robots = meta.noindex ? 'noindex,nofollow' : 'index,follow'
  const ogImage = meta.ogImage ? `<meta property="og:image" content="${escapeHtml(meta.ogImage)}">` : ''
  const jsonLd = meta.jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c')}</script>`
    : ''
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(meta.title)}</title>
<meta name="description" content="${escapeHtml(meta.description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${escapeHtml(meta.canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${escapeHtml(meta.title)}">
<meta property="og:description" content="${escapeHtml(meta.description)}">
<meta property="og:url" content="${escapeHtml(meta.canonical)}">
${ogImage}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(meta.title)}">
<meta name="twitter:description" content="${escapeHtml(meta.description)}">
<style>${STYLES}</style>
${jsonLd}
</head>
<body>
<header class="site"><div class="wrap">
<a class="brand" href="${SITE_BASE}">Saw<span>ari</span></a>
<nav class="nav">
<a href="/courses">Courses</a>
<a href="${appUrl('/today')}">Sign in</a>
</nav>
</div></header>
<main><div class="wrap">
${inner}
</div></main>
<footer class="site"><div class="wrap">
<a href="/courses">Courses</a>
<a href="${SITE_BASE}">Home</a>
<a href="${SITE_BASE}/privacy">Privacy</a>
<a href="${SITE_BASE}/terms">Terms</a>
<p style="margin-top:12px">Sawari builds a personal learning path you can actually finish.</p>
</div></footer>
</body>
</html>`
}

/* --------------------------- list page ---------------------------- */

export interface ListParams {
  q: string
  tag: string
  level: string
  page: number
  limit: number
}

interface CatalogCard {
  slug: string
  subject: string
  summary: string
  level: string | null
  tags: string[]
  expectedWeeks: number
  expectedHours: number
  enrollments: number
  reviewsCount: number
  reviewsAvg: number
}

function cardHtml(card: CatalogCard): string {
  const bits: string[] = []
  if (card.expectedWeeks) bits.push(`${card.expectedWeeks} weeks`)
  if (card.expectedHours) bits.push(`${card.expectedHours} hrs`)
  if (card.reviewsCount > 0) bits.push(`${card.reviewsAvg}★ (${card.reviewsCount})`)
  if (card.enrollments > 0) bits.push(`${card.enrollments} enrolled`)
  const meta = bits.length ? `<div class="meta-row">${bits.map((b) => `<span>${escapeHtml(b)}</span>`).join('')}</div>` : ''
  const tags = card.tags.length
    ? `<div class="chips">${card.tags.slice(0, 3).map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join('')}</div>`
    : ''
  return `<a class="card" href="/courses/${encodeURIComponent(card.slug)}">
<h3>${escapeHtml(card.subject)}</h3>
<p>${escapeHtml(card.summary || 'A structured path to learn something new.')}</p>
${meta}
${tags}
</a>`
}

export async function renderCourseList(params: ListParams): Promise<string> {
  const filter: Record<string, unknown> = { published: true }
  if (params.q) {
    const rx = { $regex: params.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
    filter.$or = [{ subject: rx }, { summary: rx }, { tags: rx }]
  }
  if (params.tag) filter.tags = params.tag
  if (params.level) filter.level = params.level

  const skip = (params.page - 1) * params.limit
  const [items, total] = await Promise.all([
    CatalogPath.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .select('slug subject summary level tags expectedWeeks expectedHours enrollments reviewsCount reviewsAvg')
      .lean<CatalogCard[]>(),
    CatalogPath.countDocuments(filter),
  ])

  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.tag) query.set('tag', params.tag)
  if (params.level) query.set('level', params.level)

  const heading = params.q
    ? `Courses matching “${escapeHtml(params.q)}”`
    : params.tag
      ? `Courses tagged “${escapeHtml(params.tag)}”`
      : 'Browse courses'

  const grid = items.length
    ? `<div class="grid">${items.map(cardHtml).join('')}</div>`
    : `<div class="empty">No courses found yet. Check back soon.</div>`

  const pages = Math.max(1, Math.ceil(total / params.limit))
  const pager =
    pages > 1
      ? `<nav class="pager">
${params.page > 1 ? `<a href="?${withPage(query, params.page - 1)}">← Previous</a>` : '<span></span>'}
<span>Page ${params.page} of ${pages}</span>
${params.page < pages ? `<a href="?${withPage(query, params.page + 1)}">Next →</a>` : '<span></span>'}
</nav>`
      : ''

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: heading,
    url: `${SITE_BASE}/courses`,
    hasPart: items.map((c) => ({
      '@type': 'Course',
      name: c.subject,
      url: `${SITE_BASE}/courses/${c.slug}`,
    })),
  }

  const inner = `
<h1>${heading}</h1>
<p class="lede">Free, structured courses anyone can follow. Browse without an account.</p>
<form class="search" method="get" action="/courses" role="search">
<input type="search" name="q" value="${escapeHtml(params.q)}" placeholder="Search courses, tags, subjects…" aria-label="Search courses">
<button type="submit">Search</button>
</form>
${grid}
${pager}`

  return page(
    {
      title: `${heading} · ${SITE_NAME}`,
      description: 'Browse free, structured courses on Sawari. Explore by subject, level, and tag.',
      canonical: `${SITE_BASE}/courses`,
      noindex: Boolean(params.q || params.tag || params.level),
      jsonLd,
    },
    inner,
  )
}

function withPage(query: URLSearchParams, page: number): string {
  const next = new URLSearchParams(query)
  if (page > 1) next.set('page', String(page))
  return next.toString()
}

/* -------------------------- detail page --------------------------- */

interface DetailReview {
  rating: number
  text: string
  author: string
}

interface RawReview {
  rating: number
  text: string
  userId?: { firstName?: string; lastName?: string } | null
}

function renderBlocks(blocks: LessonBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'h':
          return `<h3>${escapeHtml(block.text)}</h3>`
        case 'p':
          return `<p>${escapeHtml(block.text)}</p>`
        case 'list':
          return `<ul>${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
        case 'steps':
          return `<ol>${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ol>`
        case 'note':
          return `<div class="note"><strong>${escapeHtml(block.title)}</strong>${escapeHtml(block.text)}</div>`
        default:
          return ''
      }
    })
    .join('')
}

function stars(rating: number): string {
  const full = Math.round(rating)
  return '★'.repeat(full) + '☆'.repeat(Math.max(0, 5 - full))
}

export async function renderCourseDetail(slug: string): Promise<string | null> {
  const path = await CatalogPath.findOne({ slug, published: true }).lean()
  if (!path) return null

  const rawReviews = await CatalogReview.find({ catalogPathId: path._id })
    .sort({ createdAt: -1 })
    .limit(6)
    .populate('userId', 'firstName lastName')
    .lean<RawReview[]>()
  const reviews: DetailReview[] = rawReviews.map((r) => {
    const first = r.userId?.firstName ?? 'A learner'
    const lastInitial = r.userId?.lastName?.trim()?.[0]
    return {
      rating: r.rating,
      text: r.text,
      author: lastInitial ? `${first} ${lastInitial}.` : first,
    }
  })

  const sections = [...path.sections].sort((a, b) => a.order - b.order)
  const totalMinutes = sections.reduce((sum, s) => sum + s.minutes, 0)

  const sectionCards = sections
    .map((section) => {
      const content = section.content as SessionContent
      const lesson = content.lesson
      const resources = content.resources ?? []
      return `<div class="section">
<h3>${escapeHtml(section.title)}</h3>
<div class="mins">${section.minutes ? `${section.minutes} min · ` : ''}${resources.length} resource${resources.length === 1 ? '' : 's'}</div>
${section.description ? `<p>${escapeHtml(section.description)}</p>` : ''}
${lesson ? `<p><strong>${escapeHtml(lesson.title)}</strong> — ${escapeHtml(lesson.intro)}</p>${renderBlocks(lesson.blocks)}` : ''}
${resources.length ? resources.map((r) => `<div class="resource"><span>${escapeHtml(r.title)}</span><span class="mins">${escapeHtml(r.kind)} · ${r.minutes} min</span></div>`).join('') : ''}
${content.assessment?.questions?.length ? `<p class="mins" style="margin-top:12px">${content.assessment.questions.length} question check at the end.</p>` : ''}
</div>`
    })
    .join('')

  const reviewList = reviews.length
    ? `<h2>Reviews</h2>${reviews
        .map((r) => {
          const author = r.author || 'A learner'
          return `<div class="review"><div><span class="who">${escapeHtml(author)}</span> <span class="stars">${stars(r.rating)}</span></div>${r.text ? `<p>${escapeHtml(r.text)}</p>` : ''}</div>`
        })
        .join('')}`
    : ''

  const bits: string[] = []
  if (path.level) bits.push(path.level)
  if (path.expectedWeeks) bits.push(`${path.expectedWeeks} weeks`)
  if (path.expectedHours) bits.push(`${path.expectedHours} hrs`)
  if (totalMinutes) bits.push(`${Math.round(totalMinutes / 60)} hrs of material`)
  if (path.reviewsCount > 0) bits.push(`${path.reviewsAvg}★ (${path.reviewsCount})`)
  if (path.enrollments > 0) bits.push(`${path.enrollments} enrolled`)

  const canUrl = `${SITE_BASE}/courses/${encodeURIComponent(path.slug)}`
  const slugPath = encodeURIComponent(path.slug)
  const actions = `<div class="actions">
<a class="cta" href="${actionUrl(`/start/${slugPath}`)}">Start this course</a>
<a class="cta ghost" href="${actionUrl(`/save/${slugPath}`)}">Save for later</a>
</div>`
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: path.subject,
    description: path.summary || path.goal || `A guided course to learn ${path.subject}.`,
    url: canUrl,
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_BASE },
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', category: 'Free' },
  }
  if (path.reviewsCount > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: path.reviewsAvg,
      reviewCount: path.reviewsCount,
      bestRating: 5,
    }
  }

  const inner = `
<div class="crumbs"><a href="/courses">Courses</a> / ${escapeHtml(path.subject)}</div>
<h1>${escapeHtml(path.subject)}</h1>
${path.summary ? `<p class="lede">${escapeHtml(path.summary)}</p>` : ''}
<div class="meta-row">${bits.map((b) => `<span>${escapeHtml(b)}</span>`).join('')}</div>
${path.tags.length ? `<div class="chips">${path.tags.map((t) => `<a class="chip" href="/courses?tag=${encodeURIComponent(t)}">${escapeHtml(t)}</a>`).join('')}</div>` : ''}
${actions}
${path.goal ? `<h2>What you'll be able to do</h2><p>${escapeHtml(path.goal)}</p>` : ''}
<h2>What's inside</h2>
${sectionCards || '<div class="empty">Sections are being prepared.</div>'}
${reviewList}
<p><a class="cta ghost" href="${actionUrl(`/review/${slugPath}`)}">Write a review</a></p>`

  return page(
    {
      title: `${path.subject} · ${SITE_NAME}`,
      description: (path.summary || `A free, structured course to learn ${path.subject} on Sawari.`).slice(0, 160),
      canonical: canUrl,
      ogImage: path.ogImage,
      jsonLd,
    },
    inner,
  )
}

/* --------------------------- not found ---------------------------- */

export function renderCourseNotFound(): string {
  return page(
    {
      title: `Course not found · ${SITE_NAME}`,
      description: 'This course could not be found.',
      canonical: `${SITE_BASE}/courses`,
      noindex: true,
    },
    `<h1>Course not found</h1><p class="lede">That course may have been unpublished or renamed.</p><a class="cta" href="/courses">Browse all courses</a>`,
  )
}

/* ----------------------- sitemap + robots ------------------------- */

export async function renderSitemap(): Promise<string> {
  const paths = await CatalogPath.find({ published: true })
    .sort({ updatedAt: -1 })
    .select('slug updatedAt')
    .lean<Array<{ slug: string; updatedAt: Date }>>()

  const urls = [
    { loc: `${SITE_BASE}/`, lastmod: undefined as string | undefined },
    { loc: `${SITE_BASE}/courses`, lastmod: paths[0]?.updatedAt?.toISOString() },
    ...paths.map((p) => ({ loc: `${SITE_BASE}/courses/${p.slug}`, lastmod: p.updatedAt?.toISOString() })),
  ]

  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${escapeHtml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ''}\n  </url>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

export function renderRobots(): string {
  return `User-agent: *\nAllow: /\nDisallow: /app/\nDisallow: /api/\nDisallow: /start/\nDisallow: /save/\nDisallow: /review/\n\nSitemap: ${SITE_BASE}/sitemap.xml\n`
}
