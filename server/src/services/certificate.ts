import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { httpError } from '../lib/AppError.js'
import { renderTemplate, sendEmail } from '../mail/index.js'
import { CatalogPath, type CatalogPathDocument } from '../models/CatalogPath.js'
import { Certificate, type CertificateDocument } from '../models/Certificate.js'
import { findEnrollment } from './catalog.js'

export interface CertificateUser {
  id: string
  firstName: string
  lastName?: string
  email: string
  role?: string
}

export interface FormattedCertificate {
  credentialId: string
  recipientName: string
  courseSubject: string
  courseSlug: string
  sectionsCount: number
  hoursCount: number
  levelLabel: string
  issuedDate: string
  archivalHash: string
  verificationUrl: string
  isAdminPreview: boolean
  eligible: boolean
}

const MONTH_NAMES = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
]

function formatIssueDate(date: Date): string {
  const day = date.getDate()
  const month = MONTH_NAMES[date.getMonth()] ?? 'OCTOBER'
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

function deriveCourseCode(slug: string): string {
  const customMap: Record<string, string> = {
    'product-management': 'PM',
    'sql-fundamentals': 'SQL',
    'python-basics': 'PY',
    'public-speaking': 'PS',
    'data-analytics': 'DA',
    'ui-ux-design': 'UX',
    'digital-marketing': 'DM',
    'project-management': 'PJM',
  }
  if (customMap[slug]) return customMap[slug]!
  return slug
    .split('-')
    .map((word) => word[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 4)
}

function deriveCredentialSequence(userId: string, catalogId: string): string {
  const hash = crypto.createHash('sha256').update(`${userId}:${catalogId}`).digest('hex')
  const num = parseInt(hash.slice(0, 8), 16) % 90000 + 10000
  return String(num).padStart(5, '0')
}

function deriveArchivalHash(userId: string, catalogId: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(`sawari:credential:${userId}:${catalogId}`)
    .digest('hex')
  return `${hash.slice(0, 8)}...${hash.slice(-4)}`
}

export async function getOrIssueCertificate(
  user: CertificateUser,
  slug: string,
): Promise<FormattedCertificate> {
  const catalog = await CatalogPath.findOne({ slug, published: true }).lean()
  if (!catalog) throw httpError.notFound('Catalog path not found.')

  const enrollment = await findEnrollment(user.id, catalog._id.toString())
  const total = enrollment ? enrollment.sections.length : 0
  const completed = enrollment
    ? enrollment.sections.filter((s) => s.status === 'completed').length
    : 0

  const isCompleted100 = total > 0 && completed === total
  const isAdmin = user.role === 'admin'

  if (!isCompleted100 && !isAdmin) {
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0
    throw httpError.forbidden(
      `You have completed ${percent}% of this course. Complete 100% of all sections to earn your certificate.`,
    )
  }

  const year = new Date().getFullYear()
  const code = deriveCourseCode(catalog.slug)
  const seq = deriveCredentialSequence(user.id, catalog._id.toString())
  const credentialId = `SWR-${code}-${year}-${seq}`
  const archivalHash = deriveArchivalHash(user.id, catalog._id.toString())

  const sectionsCount = catalog.sections.length
  const totalMinutes = catalog.sections.reduce((sum, s) => sum + s.minutes, 0)
  const hoursCount = catalog.expectedHours || Math.max(1, Math.round(totalMinutes / 60))

  const levelRaw = catalog.level || 'all-levels'
  const levelLabel =
    levelRaw === 'beginner'
      ? 'BEGINNER LEVEL'
      : levelRaw === 'some'
        ? 'INTERMEDIATE LEVEL'
        : levelRaw === 'comfortable'
          ? 'ADVANCED LEVEL'
          : `${levelRaw.toUpperCase()} LEVEL`

  const recipientName =
    `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Learner'
  const baseUrl = env.FRONTEND_URL || 'https://sawari.synchrome.co'
  const verificationUrl = `${baseUrl}/verify/${credentialId}`

  let issuedDateStr = formatIssueDate(new Date())

  // If completed, record the certificate permanently in database
  if (isCompleted100) {
    const cert = await Certificate.findOneAndUpdate(
      { userId: user.id, catalogPathId: catalog._id },
      {
        $setOnInsert: {
          credentialId,
          recipientName,
          courseSubject: catalog.subject,
          courseSlug: catalog.slug,
          sectionsCount,
          hoursCount,
          level: levelLabel,
          archivalHash,
          issuedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' },
    ).lean()

    if (cert?.issuedAt) {
      issuedDateStr = formatIssueDate(new Date(cert.issuedAt))
    }
  }

  return {
    credentialId,
    recipientName,
    courseSubject: catalog.subject,
    courseSlug: catalog.slug,
    sectionsCount,
    hoursCount,
    levelLabel,
    issuedDate: issuedDateStr,
    archivalHash,
    verificationUrl,
    isAdminPreview: !isCompleted100 && isAdmin,
    eligible: true,
  }
}

export async function sendCertificateToEmail(
  user: CertificateUser,
  slug: string,
): Promise<{ sent: boolean; email: string }> {
  const cert = await getOrIssueCertificate(user, slug)
  const baseUrl = env.FRONTEND_URL || 'https://sawari.synchrome.co'
  const certificateUrl = `${baseUrl}/app/certificate/${encodeURIComponent(slug)}`

  const rendered = renderTemplate('course-certificate', {
    firstName: user.firstName || 'Learner',
    subject: cert.courseSubject,
    credentialId: cert.credentialId,
    certificateUrl,
    issuedDate: cert.issuedDate,
  })

  await sendEmail({
    to: user.email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  })

  await Certificate.updateOne(
    { credentialId: cert.credentialId },
    { $set: { emailSentAt: new Date() } },
  )

  return { sent: true, email: user.email }
}

export async function findPublicCertificate(credentialId: string): Promise<FormattedCertificate | null> {
  const cert = await Certificate.findOne({ credentialId: credentialId.toUpperCase() }).lean()
  if (!cert) return null

  const baseUrl = env.FRONTEND_URL || 'https://sawari.synchrome.co'
  return {
    credentialId: cert.credentialId,
    recipientName: cert.recipientName,
    courseSubject: cert.courseSubject,
    courseSlug: cert.courseSlug,
    sectionsCount: cert.sectionsCount,
    hoursCount: cert.hoursCount,
    levelLabel: cert.level,
    issuedDate: formatIssueDate(new Date(cert.issuedAt)),
    archivalHash: cert.archivalHash,
    verificationUrl: `${baseUrl}/verify/${cert.credentialId}`,
    isAdminPreview: false,
    eligible: true,
  }
}
