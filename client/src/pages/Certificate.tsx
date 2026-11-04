import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LuAward, LuMail, LuPrinter, LuShieldCheck, LuSparkles } from 'react-icons/lu'
import { Footer, Header } from '../components/landing'
import { Button } from '../components/ui/Button'
import { CertificateCard } from '../components/certificate/CertificateCard'
import { ApiError, catalogApi, type ApiCertificate } from '../lib/api'
import { useAlert } from '../state/alertContext'
import { useApp } from '../state/store'

export function CertificatePage() {
  const { slug = '' } = useParams()
  const { state } = useApp()
  const alert = useAlert()
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [certificate, setCertificate] = useState<ApiCertificate | null>(null)
  const [emailing, setEmailing] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setErrorMsg(null)
    setCertificate(null)
    catalogApi.certificate(slug, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setCertificate(data)
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        if (import.meta.env.DEV && error instanceof ApiError && error.status === 403) {
          return catalogApi.get(slug, controller.signal).then((course) => {
            if (controller.signal.aborted) return
            const level = course.level ? `${course.level.toUpperCase()} LEVEL` : 'ALL LEVELS'
            const previewId = `PREVIEW-${slug.toUpperCase()}`
            setCertificate({
              credentialId: previewId,
              recipientName: state.user?.name || 'Your Name',
              courseSubject: course.subject,
              courseSlug: course.slug,
              sectionsCount: course.sections.length,
              hoursCount: course.expectedHours,
              levelLabel: level,
              issuedDate: new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date()),
              archivalHash: 'LOCAL PREVIEW ONLY',
              verificationUrl: `${window.location.origin}/verify/${encodeURIComponent(previewId)}`,
              isAdminPreview: true,
              eligible: true,
            })
          }).catch(() => {
            if (!controller.signal.aborted) setErrorMsg('Could not load the course for certificate preview.')
          })
          return
        }
        const message = error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Could not load certificate.'
        setErrorMsg(message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [slug, state.user?.name])

  useEffect(() => {
    document.title = certificate ? `${certificate.courseSubject} Certificate | Sawari` : 'Certificate | Sawari'
  }, [certificate?.courseSubject])

  const handleEmail = async () => {
    setEmailing(true)
    try {
      const result = await catalogApi.emailCertificate(slug)
      setEmailSent(true)
      alert.success(`Certificate emailed to ${result.email}.`)
    } catch (error) {
      alert.fromError(error, 'Failed to email certificate.')
    } finally {
      setEmailing(false)
    }
  }

  return (
    <div className="landing-page min-h-screen bg-[#faf9f7] text-[#514a58] print:bg-white">
      <div className="print:hidden"><Header /></div>
      <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 sm:px-6 sm:pt-9 lg:px-10 print:max-w-none print:p-0">
        {loading ? (
          <div className="mx-auto max-w-[1040px]" role="status" aria-label="Loading certificate">
            <div className="mb-6 h-3 w-36 animate-pulse rounded-full bg-[#ece7f0] print:hidden" />
            <div className="mb-5 h-8 w-2/3 animate-pulse rounded-lg bg-[#ece7f0] print:hidden" />
            <div className="aspect-[1.42] w-full animate-pulse rounded-2xl border border-[#e8e4ec] bg-white p-5 shadow-sm print:hidden">
              <div className="h-full rounded-xl bg-gradient-to-br from-[#faf7fd] via-white to-[#f5f0f9]" />
            </div>
            <p className="sr-only">Loading your verified certificate…</p>
          </div>
        ) : errorMsg || !certificate ? (
          <div className="mx-auto max-w-[900px]">
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-[11px] text-[#918a99] print:hidden">
              <Link className="font-bold text-[#713bd1] no-underline hover:underline" to={`/courses/${encodeURIComponent(slug)}`}>Course</Link><span aria-hidden="true">/</span><span>Certificate</span>
            </nav>
            <section className="overflow-hidden rounded-2xl border border-[#e8e4ec] bg-white shadow-[0_14px_40px_rgba(33,27,42,0.07)]">
              <div className="flex items-start gap-4 border-b border-[#eeeaf1] bg-gradient-to-r from-[#f7f0fc] to-[#fbf9fc] p-5 sm:p-7">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-[#713bd1] shadow-sm"><LuAward className="h-6 w-6" /></span>
                <div><p className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#713bd1]">Certificate of completion</p><h1 className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-[#211b2a] sm:text-[26px]">Your certificate isn’t unlocked yet</h1></div>
              </div>
              <div className="p-5 sm:p-7">
                <p className="max-w-[680px] text-[13px] leading-6 text-[#625c67]">{errorMsg || 'Complete every section of this course to earn your verified certificate.'}</p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  <Link to="/app/path" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#713bd1] px-5 text-[12px] font-extrabold text-white shadow-[0_5px_14px_rgba(113,59,209,0.18)] transition hover:-translate-y-0.5 hover:bg-[#5e2eb3]">Resume course</Link>
                  <Link to={`/courses/${encodeURIComponent(slug)}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#e3d9ee] bg-white px-5 text-[12px] font-bold text-[#6130ae] transition hover:bg-[#f8f3fc]">Course outline</Link>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="mx-auto max-w-[1120px]">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 print:hidden">
              <div>
                <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-[11px] text-[#918a99]">
                  <Link className="font-bold text-[#713bd1] no-underline hover:underline" to={`/courses/${encodeURIComponent(slug)}`}>Course</Link><span aria-hidden="true">/</span><span>Certificate</span>
                </nav>
                <div className="flex items-center gap-2 text-[#713bd1]"><LuShieldCheck className="h-4 w-4" /><span className="text-[10px] font-extrabold uppercase tracking-[0.11em]">Verified credential</span></div>
                <h1 className="mt-1 text-[24px] font-extrabold tracking-[-0.035em] text-[#211b2a] sm:text-[30px]">{certificate.courseSubject}</h1>
                <p className="mt-1 text-[12px] text-[#77717e]">Your achievement, ready to print or share.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="md" className="rounded-xl border-[#e3d9ee] bg-white px-4 text-[11px] font-extrabold text-[#514a58] hover:bg-[#f8f3fc]" onClick={() => window.print()}>
                  <LuPrinter className="mr-1.5 h-4 w-4" /> Print / Save PDF
                </Button>
                <Button variant="accent" size="md" className="rounded-xl px-4 text-[11px] font-extrabold shadow-[0_5px_14px_rgba(113,59,209,0.18)] hover:-translate-y-0.5" disabled={certificate.isAdminPreview} loading={emailing} onClick={() => void handleEmail()}>
                  <LuMail className="mr-1.5 h-4 w-4" /> {certificate.isAdminPreview ? 'Preview only' : emailSent ? 'Email sent' : 'Email to me'}
                </Button>
              </div>
            </div>

            {certificate.isAdminPreview && (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f0d99e] bg-[#fff9e8] px-4 py-3 text-[12px] text-[#765817] print:hidden">
                <div className="flex items-center gap-2"><LuSparkles className="h-4 w-4 shrink-0 text-[#bd8514]" /><span><strong>Preview only:</strong> this is not an issued or verifiable credential.</span></div>
                <span className="rounded-full bg-[#f7ebc8] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em]">Preview mode</span>
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-[10px] print:hidden">
              <Link to={`/courses/${encodeURIComponent(slug)}`} className="font-bold text-[#713bd1] no-underline hover:underline">← Back to course</Link>
              <span className="rounded-full border border-[#e8e4ec] bg-white px-3 py-1.5 font-semibold text-[#77717e]">Credential ID: <strong className="text-[#30283b]">{certificate.credentialId}</strong></span>
            </div>

            <div className="print:m-0 print:p-0"><CertificateCard certificate={certificate} /></div>
          </div>
        )}
      </main>
      <div className="print:hidden"><Footer /></div>
    </div>
  )
}
