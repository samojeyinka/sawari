import { env } from '../config/env.js'
import { EXPERIENCE_LEVELS, type ExperienceLevel } from '../domain/index.js'
import { CatalogPath } from '../models/CatalogPath.js'
import { CatalogReview } from '../models/CatalogReview.js'
import type { SessionContent } from '../models/SessionContent.js'

/* ------------------------------------------------------------------ */
/*  Server-rendered public catalog surface. These pages exist so the    */
/*  catalog is crawlable and shareable without an account. They share    */
/*  the app's dark "band" design system and header so they read as the   */
/*  same product. Read-only: enrolling and reviewing happen in the app.  */
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

/* Tokens mirror client/src/index.css @theme so the public pages render in the
   same warm-cool navy "band" palette as the landing page and the app shell. */
const STYLES = `
  :root{
    --band:#001e2b;--band-deep:#001521;--band-soft:#072736;--band-teal:#06283a;
    --panel:#0b2a3a;--panel-soft:#133b4e;
    --on-band:#f2f5f7;--on-band-muted:#cdd8de;--on-band-dim:#93a7b1;
    --accent-bright:#35b3a3;--accent-soft:rgba(53,179,163,.14);
    --warn-bright:#e8a15c;--blue-bright:#5aaad2;--success-bright:#3fca96;
    --line:rgba(203,225,235,.14);--line-strong:rgba(203,225,235,.26);
    --font-sans:'Figtree',system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    --font-mono:'DM Mono',ui-monospace,'SFMono-Regular',Menlo,monospace;
  }
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{margin:0;background:var(--band);color:var(--on-band-muted);font-family:var(--font-sans);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
  a{color:inherit}
  img{max-width:100%}
  h1,h2,h3{color:var(--on-band);letter-spacing:-.02em;line-height:1.15;font-weight:600;margin:0}
  .inset{width:100%;max-width:1880px;margin:0 auto;padding:0 24px}
  @media(min-width:640px){.inset{padding:0 32px}}
  @media(min-width:1024px){.inset{padding:0 48px}}
  @media(min-width:1280px){.inset{padding:0 80px}}

  .site-header{position:sticky;top:0;z-index:40;border-bottom:1px solid var(--line);background:rgba(0,30,43,.9);backdrop-filter:blur(8px)}
  .site-header .inset{display:flex;height:76px;align-items:center;justify-content:space-between;gap:24px}
  .brand{flex-shrink:0;display:inline-flex}
  .brand img{height:30px;width:auto;display:block}
  .site-nav{display:none;align-items:center;gap:8px}
  @media(min-width:1024px){.site-nav{display:flex}}
  .nav-link{position:relative;display:inline-flex;overflow:hidden;padding:8px 12px;font-family:var(--font-mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--on-band-dim);text-decoration:none;transition:color .15s}
  .nav-link:hover{color:var(--on-band)}
  .nav-link .sweep{position:absolute;inset:0;transform-origin:left;transform:scaleX(0);background:rgba(53,179,163,.25);transition:transform .3s ease-out}
  .nav-link:hover .sweep,.nav-link:focus-visible .sweep{transform:scaleX(1)}
  .nav-link .label{position:relative}
  .site-actions{display:flex;align-items:center;gap:16px}
  @media(min-width:640px){.site-actions{gap:24px}}
  .login-link{font-family:var(--font-mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--on-band-dim);text-decoration:none;padding:8px 0;transition:color .15s}
  .login-link:hover{color:var(--on-band)}

  .btn{position:relative;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;text-decoration:none;font-weight:500;transition:color .2s}
  .btn .sweep{position:absolute;inset:0;transform-origin:left;transform:scaleX(0);transition:transform .35s ease-out}
  .btn:hover .sweep,.btn:focus-visible .sweep{transform:scaleX(1)}
  .btn .label{position:relative;z-index:1}
  .btn-small{height:38px;padding:0 20px;background:var(--on-band);color:var(--band);font-size:13.5px}
  .btn-small .sweep,.btn-primary .sweep{background:var(--accent-bright)}
  .btn-primary{height:46px;padding:0 24px;background:var(--on-band);color:var(--band);font-size:14.5px}
  .btn-outline{height:46px;padding:0 24px;border:1px solid var(--line-strong);color:var(--on-band);font-size:14.5px;background:transparent}
  .btn-outline .sweep{background:rgba(242,245,247,.08)}
  .btn-outline:hover{border-color:var(--on-band)}

  main{padding:48px 0 88px}
  .crumbs{font-family:var(--font-mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--on-band-dim);margin-bottom:20px}
  .crumbs a{color:var(--on-band-dim);text-decoration:none}
  .crumbs a:hover{color:var(--accent-bright)}
  h1.title{font-size:clamp(30px,4vw,46px);font-weight:300;letter-spacing:-.025em}
  .lede{font-size:15.5px;line-height:1.6;color:var(--on-band-muted);max-width:62ch;margin:16px 0 0}

  .filters{margin:28px 0 8px;border:1px solid var(--line);background:var(--panel);padding:18px}
  .filters-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
  .filter-search{display:flex;flex:1;min-width:240px;gap:8px}
  .filter-search input{flex:1;min-width:0;height:46px;padding:0 14px;background:var(--band);border:1px solid var(--line);color:var(--on-band);font-size:15px;font-family:var(--font-sans)}
  .filter-search input::placeholder{color:var(--on-band-dim)}
  .filter-search input:focus{outline:2px solid var(--accent-bright);border-color:transparent}
  select.sort{height:46px;padding:0 14px;background:var(--band);border:1px solid var(--line);color:var(--on-band);font-size:14px;font-family:var(--font-sans);min-width:140px}
  select.sort:focus{outline:2px solid var(--accent-bright)}
  .facet{margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}
  .facet-label{display:block;font-family:var(--font-mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--on-band-dim);margin-bottom:10px}
  .pills{display:flex;flex-wrap:wrap;gap:8px}
  .pills-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;scrollbar-width:thin;-webkit-overflow-scrolling:touch}
  .pill{padding:5px 12px;border:1px solid var(--line);color:var(--on-band-muted);font-size:13px;text-decoration:none;white-space:nowrap;transition:border-color .15s,color .15s,background .15s}
  .pill:hover{border-color:var(--line-strong);color:var(--on-band)}
  .pill.on{background:var(--accent-soft);border-color:var(--accent-bright);color:var(--accent-bright)}
  .topics-drawer{margin-top:10px}
  .topics-toggle{font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--accent-bright);cursor:pointer;user-select:none;padding:4px 0}
  .topics-toggle:hover{text-decoration:underline}
  .all-topics-grid{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;padding:12px;background:var(--band);border:1px solid var(--line);max-height:180px;overflow-y:auto}
  .active-filters{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}
  .active-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:var(--accent-soft);border:1px solid var(--accent-bright);color:var(--accent-bright);font-size:12px}
  .active-chip a{color:var(--accent-bright);text-decoration:none;font-weight:bold;margin-left:4px}
  .active-chip a:hover{opacity:.8}

  .results-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:12px;margin:30px 0 0}
  .results-count{font-family:var(--font-mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--on-band-dim)}
  .clear{font-size:13px;color:var(--accent-bright);text-decoration:none}
  .clear:hover{text-decoration:underline}

  .grid{display:grid;gap:16px;grid-template-columns:1fr;margin-top:20px}
  @media(min-width:700px){.grid{grid-template-columns:repeat(2,1fr)}}
  @media(min-width:1024px){.grid{grid-template-columns:repeat(3,1fr)}}
  @media(min-width:1536px){.grid{grid-template-columns:repeat(4,1fr)}}
  .card{display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);padding:20px;text-decoration:none;transition:border-color .15s,transform .15s}
  .card:hover{border-color:var(--line-strong);transform:translateY(-2px)}
  .card-top{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:22px}
  .level{border:1px solid var(--line-strong);padding:3px 8px;font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--on-band-dim)}
  .card h3{margin:14px 0 8px;font-size:18px;font-weight:500}
  .card .summary{color:var(--on-band-muted);font-size:14px;margin:0 0 16px;flex:1}
  .card .meta{display:flex;flex-wrap:wrap;gap:6px 14px;font-family:var(--font-mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--on-band-dim);margin-top:auto}
  .rating-inline{display:inline-flex;align-items:center;gap:6px}
  .rc{font-size:12.5px;color:var(--on-band-muted)}
  .rc.dim{font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--on-band-dim)}
  .tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
  .tag{font-size:12px;color:var(--accent-bright);border:1px solid var(--line);padding:2px 8px;text-decoration:none}

  .stars{position:relative;display:inline-block;font-size:13px;letter-spacing:2px;line-height:1}
  .stars span{display:block;white-space:nowrap}
  .stars .base{color:rgba(203,225,235,.2)}
  .stars .fill{position:absolute;top:0;left:0;overflow:hidden;color:var(--accent-bright)}

  .detail-head{max-width:820px}
  .meta-row{display:flex;flex-wrap:wrap;gap:8px 18px;font-family:var(--font-mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--on-band-dim);margin:18px 0}
  .chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}
  .actions{display:flex;flex-wrap:wrap;gap:12px;margin:22px 0 8px}
  h2{font-size:24px;margin:48px 0 16px}
  .section{border:1px solid var(--line);background:var(--panel);padding:22px;margin:14px 0}
  .section>summary{display:flex;align-items:baseline;justify-content:space-between;gap:12px;cursor:pointer;list-style:none}
  .section>summary::-webkit-details-marker{display:none}
  .section>summary h3{margin:0;font-size:17px;font-weight:500}
  .section>summary h2{margin:0;font-size:24px}
  .section>summary:hover h3,.section>summary:hover h2{color:var(--accent-bright)}
  .section>summary:focus-visible{outline:2px solid var(--accent-bright);outline-offset:4px}
  .section>summary .mins::after{content:'+';margin-left:12px;color:var(--accent-bright);font-size:15px}
  .section[open]>summary .mins::after{content:'\\2212'}
  .section h3{margin:0;font-size:17px;font-weight:500}
  .mins{font-family:var(--font-mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--on-band-dim)}
  .section p{color:var(--on-band-muted);font-size:14.5px;margin:10px 0 0}
  .section ul,.section ol{margin:10px 0 0;padding-left:22px;color:var(--on-band-muted);font-size:14.5px}
  .section li{margin:4px 0}
  .note{border-left:2px solid var(--accent-bright);background:var(--accent-soft);padding:12px 16px;margin:14px 0;font-size:14.5px;color:var(--on-band-muted)}
  .note strong{display:block;color:var(--on-band);margin-bottom:4px;font-weight:600}
  .resource{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-top:1px solid var(--line);font-size:14px;color:var(--on-band-muted)}
  .resource:first-of-type{border-top:0}
  .review{border-top:1px solid var(--line);padding:16px 0}
  .review:first-of-type{border-top:0;padding-top:4px}
  .review .who{font-weight:600;color:var(--on-band)}
  .review p{margin:8px 0 0}
  .empty{border:1px dashed var(--line-strong);color:var(--on-band-dim);padding:56px 24px;text-align:center}
  .pager{display:flex;justify-content:space-between;align-items:center;margin-top:36px;font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--on-band-dim)}
  .pager a{color:var(--accent-bright);text-decoration:none}
  .pager a:hover{text-decoration:underline}
  footer.site{border-top:1px solid var(--line);padding:32px 0;margin-top:40px}
  footer.site .inset{display:flex;flex-wrap:wrap;gap:18px;align-items:center}
  footer.site a{font-family:var(--font-mono);font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--on-band-dim);text-decoration:none}
  footer.site a:hover{color:var(--on-band)}
`

function header(): string {
  return `<header class="site-header"><div class="inset">
<a class="brand" href="/" aria-label="Sawari home"><img src="/logo.png" alt="Sawari"></a>
<nav class="site-nav">
<a class="nav-link" href="/#how"><span class="sweep" aria-hidden="true"></span><span class="label">How it works</span></a>
<a class="nav-link" href="/#included"><span class="sweep" aria-hidden="true"></span><span class="label">What's included</span></a>
<a class="nav-link" href="/courses"><span class="sweep" aria-hidden="true"></span><span class="label">Courses</span></a>
</nav>
<div class="site-actions">
<a class="login-link" href="${SITE_BASE}/login">Log in</a>
<a class="btn btn-small" href="${SITE_BASE}/setup"><span class="sweep" aria-hidden="true"></span><span class="label">Start free</span></a>
</div>
</div></header>`
}

function footer(): string {
  return `<footer class="site"><div class="inset">
<a href="/courses">Courses</a>
<a href="${SITE_BASE}/">Home</a>
<a href="${SITE_BASE}/privacy">Privacy</a>
<a href="${SITE_BASE}/terms">Terms</a>
</div></footer>`
}

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
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escapeHtml(meta.title)}</title>
<meta name="description" content="${escapeHtml(meta.description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${escapeHtml(meta.canonical)}">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@300..900&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet">
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
${header()}
<main><div class="inset">
${inner}
</div></main>
${footer()}
</body>
</html>`
}

/* --------------------------- list page ---------------------------- */

export interface ListParams {
  q: string
  tag: string
  level: string
  sort: string
  page: number
  limit: number
}

interface CatalogCard {
  slug: string
  subject: string
  summary: string
  level: ExperienceLevel | null
  tags: string[]
  expectedWeeks: number
  expectedHours: number
  enrollments: number
  reviewsCount: number
  reviewsAvg: number
}

const LEVEL_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner',
  some: 'Some experience',
  comfortable: 'Comfortable',
  advanced: 'Advanced',
}

const SORTS = [
  { value: 'new', label: 'Newest' },
  { value: 'popular', label: 'Most enrolled' },
  { value: 'rated', label: 'Highest rated' },
  { value: 'az', label: 'A–Z' },
] as const

function sortSpec(sort: string): Record<string, 1 | -1> {
  switch (sort) {
    case 'popular':
      return { enrollments: -1, publishedAt: -1 }
    case 'rated':
      return { reviewsAvg: -1, reviewsCount: -1 }
    case 'az':
      return { subject: 1 }
    default:
      return { publishedAt: -1, createdAt: -1 }
  }
}

function starsHtml(rating: number): string {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100))
  return `<span class="stars" aria-label="${rating} out of 5"><span class="base">★★★★★</span><span class="fill" style="width:${pct}%">★★★★★</span></span>`
}

/** Rebuild the list URL, overriding or clearing individual facets. */
function listQuery(
  params: ListParams,
  overrides: Partial<{ q: string; tag: string; level: string; sort: string; page: number }> = {},
): string {
  const pick = (key: 'q' | 'tag' | 'level' | 'sort'): string =>
    key in overrides ? String(overrides[key] ?? '') : params[key]
  const page = 'page' in overrides ? Number(overrides.page) : params.page
  const qs = new URLSearchParams()
  const q = pick('q')
  const tag = pick('tag')
  const level = pick('level')
  const sort = pick('sort')
  if (q) qs.set('q', q)
  if (tag) qs.set('tag', tag)
  if (level) qs.set('level', level)
  if (sort && sort !== 'new') qs.set('sort', sort)
  if (page && page > 1) qs.set('page', String(page))
  const s = qs.toString()
  return s ? `?${s}` : ''
}

function cardHtml(card: CatalogCard): string {
  const meta: string[] = []
  if (card.expectedWeeks) meta.push(`${card.expectedWeeks} wks`)
  if (card.expectedHours) meta.push(`${card.expectedHours} hrs`)
  if (card.enrollments > 0) meta.push(`${card.enrollments} enrolled`)
  const rating =
    card.reviewsCount > 0
      ? `<span class="rating-inline">${starsHtml(card.reviewsAvg)}<span class="rc">${card.reviewsAvg.toFixed(1)} · ${card.reviewsCount}</span></span>`
      : `<span class="rc dim">New</span>`
  const level = card.level
    ? `<span class="level">${escapeHtml(LEVEL_LABELS[card.level] ?? card.level)}</span>`
    : '<span></span>'
  const tags = card.tags.length
    ? `<div class="tags">${card.tags
        .slice(0, 3)
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        .join('')}</div>`
    : ''
  return `<a class="card" href="/courses/${encodeURIComponent(card.slug)}">
<div class="card-top">${level}${rating}</div>
<h3>${escapeHtml(card.subject)}</h3>
<p class="summary">${escapeHtml(card.summary || 'A structured path to learn something new.')}</p>
<div class="meta">${meta.map((m) => `<span>${escapeHtml(m)}</span>`).join('')}</div>
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

  const activeSort = SORTS.some((s) => s.value === params.sort) ? params.sort : 'new'
  const skip = (params.page - 1) * params.limit
  const [items, total, rawTags] = await Promise.all([
    CatalogPath.find(filter)
      .sort(sortSpec(activeSort))
      .skip(skip)
      .limit(params.limit)
      .select('slug subject summary level tags expectedWeeks expectedHours enrollments reviewsCount reviewsAvg')
      .lean<CatalogCard[]>(),
    CatalogPath.countDocuments(filter),
    CatalogPath.distinct('tags', { published: true }),
  ])

  const allTags = (rawTags as string[])
    .filter((t) => typeof t === 'string' && t.length > 0)
    .sort((a, b) => a.localeCompare(b))

  const featuredTags = allTags.slice(0, 8)
  if (params.tag && !featuredTags.includes(params.tag)) {
    featuredTags.push(params.tag)
  }

  const heading = params.q
    ? `Courses matching “${escapeHtml(params.q)}”`
    : params.tag
      ? `Courses tagged “${escapeHtml(params.tag)}”`
      : params.level
        ? `${escapeHtml(LEVEL_LABELS[params.level as ExperienceLevel] ?? params.level)} courses`
        : 'Browse courses'

  const levelOptions = [
    `<option value="">All levels</option>`,
    ...EXPERIENCE_LEVELS.map(
      (lv) =>
        `<option value="${lv}"${params.level === lv ? ' selected' : ''}>${LEVEL_LABELS[lv]}</option>`,
    ),
  ].join('')

  const tagOptions = [
    `<option value="">All topics (${allTags.length})</option>`,
    ...allTags.map(
      (t) =>
        `<option value="${escapeHtml(t)}"${params.tag === t ? ' selected' : ''}>${escapeHtml(t)}</option>`,
    ),
  ].join('')

  const levelPills = [
    `<a class="pill${!params.level ? ' on' : ''}" href="/courses${listQuery(params, { level: '', page: 1 })}">All levels</a>`,
    ...EXPERIENCE_LEVELS.map(
      (lv) =>
        `<a class="pill${params.level === lv ? ' on' : ''}" href="/courses${listQuery(params, { level: lv, page: 1 })}">${LEVEL_LABELS[lv]}</a>`,
    ),
  ].join('')

  const featuredTagPills = featuredTags.length
    ? [
        `<a class="pill${!params.tag ? ' on' : ''}" href="/courses${listQuery(params, { tag: '', page: 1 })}">All topics</a>`,
        ...featuredTags.map(
          (t) =>
            `<a class="pill${params.tag === t ? ' on' : ''}" href="/courses${listQuery(params, { tag: t, page: 1 })}">${escapeHtml(t)}</a>`,
        ),
      ].join('')
    : ''

  const allTagPills = allTags
    .map(
      (t) =>
        `<a class="pill${params.tag === t ? ' on' : ''}" href="/courses${listQuery(params, { tag: t, page: 1 })}">${escapeHtml(t)}</a>`,
    )
    .join('')

  const sortOptions = SORTS.map(
    (s) => `<option value="${s.value}"${activeSort === s.value ? ' selected' : ''}>${s.label}</option>`,
  ).join('')

  const hasFilters = Boolean(params.q || params.tag || params.level)
  const activeChips: string[] = []
  if (params.q) {
    activeChips.push(
      `<span class="active-chip">Search: ${escapeHtml(params.q)} <a href="/courses${listQuery(params, { q: '', page: 1 })}" aria-label="Remove search filter">✕</a></span>`,
    )
  }
  if (params.level) {
    activeChips.push(
      `<span class="active-chip">Level: ${escapeHtml(LEVEL_LABELS[params.level as ExperienceLevel] ?? params.level)} <a href="/courses${listQuery(params, { level: '', page: 1 })}" aria-label="Remove level filter">✕</a></span>`,
    )
  }
  if (params.tag) {
    activeChips.push(
      `<span class="active-chip">Topic: ${escapeHtml(params.tag)} <a href="/courses${listQuery(params, { tag: '', page: 1 })}" aria-label="Remove topic filter">✕</a></span>`,
    )
  }

  const activeFiltersBar = hasFilters
    ? `<div class="active-filters">
<span class="facet-label" style="margin:0">Active:</span>
${activeChips.join('')}
<a class="clear" href="/courses">Clear all</a>
</div>`
    : ''

  const filters = `<form class="filters" method="get" action="/courses" role="search">
<div class="filters-row">
<div class="filter-search">
<input type="search" name="q" value="${escapeHtml(params.q)}" placeholder="Search courses, tags, subjects…" aria-label="Search courses">
<button type="submit" class="btn btn-primary"><span class="sweep" aria-hidden="true"></span><span class="label">Search</span></button>
</div>
<select class="sort" name="level" aria-label="Filter by level" onchange="this.form.submit()">${levelOptions}</select>
<select class="sort" name="tag" aria-label="Filter by topic" onchange="this.form.submit()">${tagOptions}</select>
<select class="sort" name="sort" aria-label="Sort courses" onchange="this.form.submit()">${sortOptions}</select>
</div>
<div class="facet"><span class="facet-label">Level</span><div class="pills">${levelPills}</div></div>
${featuredTagPills ? `<div class="facet"><span class="facet-label">Popular topics</span><div class="pills-scroll">${featuredTagPills}</div>${allTags.length > 8 ? `<details class="topics-drawer"><summary class="topics-toggle">Browse all ${allTags.length} topics</summary><div class="all-topics-grid">${allTagPills}</div></details>` : ''}</div>` : ''}
${activeFiltersBar}
</form>`

  const grid = items.length
    ? `<div class="grid">${items.map(cardHtml).join('')}</div>`
    : `<div class="empty">No courses found. Try a different search or clear the filters.</div>`

  const resultsHead = `<div class="results-head">
<span class="results-count">${total} ${total === 1 ? 'course' : 'courses'}</span>
${hasFilters ? '<a class="clear" href="/courses">Clear filters</a>' : ''}
</div>`

  const pages = Math.max(1, Math.ceil(total / params.limit))
  const pager =
    pages > 1
      ? `<nav class="pager">
${params.page > 1 ? `<a href="/courses${listQuery(params, { page: params.page - 1 })}">← Previous</a>` : '<span></span>'}
<span>Page ${params.page} of ${pages}</span>
${params.page < pages ? `<a href="/courses${listQuery(params, { page: params.page + 1 })}">Next →</a>` : '<span></span>'}
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
<h1 class="title">${heading}</h1>
<p class="lede">Free, structured courses anyone can follow. Browse without an account — start or save one when you're ready.</p>
${filters}
${resultsHead}
${grid}
${pager}`

  return page(
    {
      title: `${heading} · ${SITE_NAME}`,
      description: 'Browse free, structured courses on Sawari. Search and filter by subject, level, and topic.',
      canonical: `${SITE_BASE}/courses`,
      noindex: Boolean(params.q || params.tag || params.level),
      jsonLd,
    },
    inner,
  )
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
      const resources = content.resources ?? []
      const facts = [
        section.minutes ? `${section.minutes} min` : '',
        resources.length ? `${resources.length} resource${resources.length === 1 ? '' : 's'}` : '',
      ].filter(Boolean)
      return `<details class="section">
<summary><h3>${escapeHtml(section.title)}</h3><span class="mins">${escapeHtml(facts.join(' · '))}</span></summary>
${section.description ? `<p>${escapeHtml(section.description)}</p>` : ''}
${resources.length ? resources.map((r) => `<div class="resource"><span>${escapeHtml(r.title)}</span><span class="mins">${escapeHtml(r.kind)} · ${r.minutes} min</span></div>`).join('') : ''}
</details>`
    })
    .join('')

  const reviewList = reviews.length
    ? `<details class="section">
<summary><h2>Reviews</h2><span class="mins">${path.reviewsAvg}★ · ${path.reviewsCount} review${path.reviewsCount === 1 ? '' : 's'}</span></summary>
${reviews
        .map((r) => {
          const author = r.author || 'A learner'
          return `<div class="review"><div><span class="who">${escapeHtml(author)}</span> <span class="rating-inline">${starsHtml(r.rating)}</span></div>${r.text ? `<p>${escapeHtml(r.text)}</p>` : ''}</div>`
        })
        .join('')}
</details>`
    : ''

  const bits: string[] = []
  if (path.level) bits.push(LEVEL_LABELS[path.level] ?? path.level)
  if (path.expectedWeeks) bits.push(`${path.expectedWeeks} weeks`)
  if (path.expectedHours) bits.push(`${path.expectedHours} hrs`)
  if (totalMinutes) bits.push(`${Math.round(totalMinutes / 60)} hrs of material`)
  if (path.reviewsCount > 0) bits.push(`${path.reviewsAvg}★ (${path.reviewsCount})`)
  if (path.enrollments > 0) bits.push(`${path.enrollments} enrolled`)

  const canUrl = `${SITE_BASE}/courses/${encodeURIComponent(path.slug)}`
  const slugPath = encodeURIComponent(path.slug)
  const actions = `<div class="actions">
<a class="btn btn-primary" href="${actionUrl(`/start/${slugPath}`)}"><span class="sweep" aria-hidden="true"></span><span class="label">Start this course</span></a>
<a class="btn btn-outline" href="${actionUrl(`/save/${slugPath}`)}"><span class="sweep" aria-hidden="true"></span><span class="label">Save for later</span></a>
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
<div class="detail-head">
<h1 class="title">${escapeHtml(path.subject)}</h1>
${path.summary ? `<p class="lede">${escapeHtml(path.summary)}</p>` : ''}
<div class="meta-row">${bits.map((b) => `<span>${escapeHtml(b)}</span>`).join('')}</div>
${path.tags.length ? `<div class="chips">${path.tags.map((t) => `<a class="pill" href="/courses?tag=${encodeURIComponent(t)}">${escapeHtml(t)}</a>`).join('')}</div>` : ''}
${actions}
</div>
${path.goal ? `<h2>What you'll be able to do</h2><p class="lede">${escapeHtml(path.goal)}</p>` : ''}
<h2>What's inside</h2>
${sectionCards || '<div class="empty">Sections are being prepared.</div>'}
${reviewList}
<p style="margin-top:28px;display:flex;flex-wrap:wrap;gap:10px">
<a class="btn btn-outline" href="${actionUrl(`/review/${slugPath}`)}"><span class="sweep" aria-hidden="true"></span><span class="label">Write a review</span></a>
<a class="btn btn-outline" href="${actionUrl(`/certificate/${slugPath}`)}"><span class="sweep" aria-hidden="true"></span><span class="label">View certificate</span></a>
</p>`

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
    `<h1 class="title">Course not found</h1><p class="lede">That course may have been unpublished or renamed.</p><p style="margin-top:22px"><a class="btn btn-primary" href="/courses"><span class="sweep" aria-hidden="true"></span><span class="label">Browse all courses</span></a></p>`,
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
    { loc: `${SITE_BASE}/privacy`, lastmod: undefined as string | undefined },
    { loc: `${SITE_BASE}/terms`, lastmod: undefined as string | undefined },
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
