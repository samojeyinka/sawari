import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LuMail, LuPrinter, LuShieldCheck, LuSparkles } from 'react-icons/lu'
import { Button } from '../components/ui/Button'
import { CertificateCard } from '../components/certificate/CertificateCard'
import { catalogApi, type ApiCertificate } from '../lib/api'
import { useAlert } from '../state/alertContext'

export function CertificatePage() {
  const { slug = '' } = useParams()
  const alert = useAlert()
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [certificate, setCertificate] = useState<ApiCertificate | null>(null)
  const [emailing, setEmailing] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setErrorMsg(null)

    catalogApi
      .certificate(slug)
      .then((data) => {
        if (active) setCertificate(data)
      })
      .catch((err) => {
        if (active) {
          const msg =
            err && typeof err === 'object' && 'message' in err
              ? String(err.message)
              : 'Could not load certificate.'
          setErrorMsg(msg)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [slug])

  const handlePrint = () => {
    window.print()
  }

  const handleEmail = async () => {
    setEmailing(true)
    try {
      const res = await catalogApi.emailCertificate(slug)
      setEmailSent(true)
      alert.success(`Certificate emailed to ${res.email}.`)
    } catch (err) {
      alert.fromError(err, 'Failed to email certificate.')
    } finally {
      setEmailing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-band py-12 text-on-band">
        <div className="text-center space-y-3">
          <div className="font-mono text-[12px] uppercase tracking-wider text-on-band-dim">
            Validating credential audit log
          </div>
          <p className="text-[14px] text-on-band-muted">Loading your verified certificate...</p>
        </div>
      </div>
    )
  }

  if (errorMsg || !certificate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-band px-6 py-12">
        <div className="mx-auto max-w-md border border-on-band/15 bg-panel p-6 text-on-band">
          <p className="font-mono text-[11px] uppercase tracking-wider text-accent-bright">
            Certificate of completion
          </p>
          <h1 className="mt-2 text-[20px] font-medium">Certificate not yet unlocked</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-on-band-muted">
            {errorMsg || 'You must complete 100% of all sections in this course to earn your verified certificate.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/app/path"
              className="inline-flex h-[38px] items-center bg-on-band px-4 text-[13px] font-medium text-band transition-opacity hover:opacity-90"
            >
              Resume course
            </Link>
            <a
              href={`/courses/${encodeURIComponent(slug)}`}
              className="inline-flex h-[38px] items-center border border-on-band/20 px-4 text-[13px] text-on-band-muted hover:text-on-band"
            >
              Course outline
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-band py-8 px-4 print:bg-white print:p-0">
      {/* Top Action Bar (Hidden on Print) */}
      <div className="mx-auto mb-8 max-w-[840px] print:hidden">
        {certificate.isAdminPreview && (
          <div className="mb-4 flex items-center justify-between gap-3 border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-[13px] text-amber-200">
            <div className="flex items-center gap-2">
              <LuSparkles className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                <strong>Admin Preview Mode:</strong> You are viewing this certificate as an administrator before course completion.
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded">
              Bypass Active
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-on-band/15 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <LuShieldCheck className="h-4 w-4 text-accent-bright" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-accent-bright">
                Verified Credential
              </span>
            </div>
            <h1 className="mt-1 text-[22px] font-light text-on-band">
              {certificate.courseSubject}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button size="sm" variant="secondary" onClick={handlePrint}>
              <LuPrinter className="mr-1.5 h-3.5 w-3.5" />
              Print / Save PDF
            </Button>
            <Button size="sm" variant="primary" loading={emailing} onClick={handleEmail}>
              <LuMail className="mr-1.5 h-3.5 w-3.5" />
              {emailSent ? 'Email sent' : 'Email to me'}
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-on-band-dim">
          <a
            href={`/courses/${encodeURIComponent(slug)}`}
            className="font-mono uppercase tracking-wider transition-colors hover:text-on-band"
          >
            ← Back to course
          </a>
          <span className="font-mono uppercase tracking-wider">
            Credential ID: {certificate.credentialId}
          </span>
        </div>
      </div>

      {/* Printable Certificate Card */}
      <div className="print:m-0 print:p-0">
        <CertificateCard certificate={certificate} />
      </div>
    </div>
  )
}
