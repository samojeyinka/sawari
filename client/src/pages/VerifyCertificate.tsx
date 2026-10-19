import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LuCheck, LuPrinter } from 'react-icons/lu'
import { Button } from '../components/ui/Button'
import { CertificateCard } from '../components/certificate/CertificateCard'
import { catalogApi, type ApiCertificate } from '../lib/api'

export function VerifyCertificatePage() {
  const { credentialId = '' } = useParams()
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [certificate, setCertificate] = useState<ApiCertificate | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setErrorMsg(null)

    catalogApi
      .verifyCertificate(credentialId)
      .then((data) => {
        if (active) setCertificate(data)
      })
      .catch((err) => {
        if (active) {
          const msg =
            err && typeof err === 'object' && 'message' in err
              ? String(err.message)
              : 'Could not verify this credential.'
          setErrorMsg(msg)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [credentialId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-band py-12 text-on-band">
        <div className="text-center space-y-3">
          <div className="font-mono text-[12px] uppercase tracking-wider text-accent-bright">
            Verifying cryptographic proof
          </div>
          <p className="text-[14px] text-on-band-muted">Inspecting credential record in archive...</p>
        </div>
      </div>
    )
  }

  if (errorMsg || !certificate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-band px-6 py-12">
        <div className="mx-auto max-w-md border border-on-band/15 bg-panel p-6 text-on-band">
          <p className="font-mono text-[11px] uppercase tracking-wider text-red-400">
            Credential verification
          </p>
          <h1 className="mt-2 text-[20px] font-medium">Record not found</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-on-band-muted">
            No verified certificate matching credential ID <strong>{credentialId}</strong> was found in the Sawari public archive.
          </p>
          <div className="mt-6">
            <Link
              to="/courses"
              className="inline-flex h-[38px] items-center bg-on-band px-4 text-[13px] font-medium text-band hover:opacity-90"
            >
              Browse verified courses
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-band py-8 px-4 print:bg-white print:p-0">
      {/* Verification Header */}
      <div className="mx-auto mb-8 max-w-[840px] print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
              <LuCheck className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-emerald-300">
                Official Sawari Credential · Authenticity Confirmed
              </p>
              <p className="text-[13.5px] text-on-band">
                Issued to <strong>{certificate.recipientName}</strong> for completing all sections of{' '}
                <strong>{certificate.courseSubject}</strong>.
              </p>
            </div>
          </div>

          <Button size="sm" variant="secondary" onClick={() => window.print()}>
            <LuPrinter className="mr-1.5 h-3.5 w-3.5" />
            Print verification
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-on-band-dim">
          <Link
            to="/courses"
            className="font-mono uppercase tracking-wider transition-colors hover:text-on-band"
          >
            ← Explore all courses
          </Link>
          <span className="font-mono uppercase tracking-wider">
            Credential: {certificate.credentialId}
          </span>
        </div>
      </div>

      {/* Render Verified Certificate */}
      <div className="print:m-0 print:p-0">
        <CertificateCard certificate={certificate} />
      </div>
    </div>
  )
}
