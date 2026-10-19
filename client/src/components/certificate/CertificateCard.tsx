import { CredentialQr } from '../ui/CredentialQr'
import type { ApiCertificate } from '../../lib/api'

export function CertificateCard({ certificate }: { certificate: ApiCertificate }) {
  const shortVerificationUrl = certificate.verificationUrl.replace(/^https?:\/\//, '')

  return (
    <div
      className="relative mx-auto w-full max-w-[840px] border border-neutral-300 bg-[#fbfbfa] p-3 sm:p-5 shadow-sm print:max-w-none print:border-neutral-400 print:p-4 print:shadow-none"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(0, 0, 0, 0.045) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 0, 0, 0.045) 1px, transparent 1px)
        `,
        backgroundSize: '22px 22px',
      }}
    >
      <div className="relative flex min-h-[580px] flex-col justify-between border border-neutral-300/90 bg-[#fbfbfa]/90 p-6 sm:p-10 print:min-h-0 print:border-neutral-400 print:p-8">
        {/* Top Header */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-4 w-4 shrink-0 items-center justify-center bg-neutral-900">
                <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              </div>
              <div>
                <h2 className="font-mono text-[12px] font-bold uppercase tracking-wider text-neutral-800">
                  SAWARI CREDENTIAL
                </h2>
                <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">
                  PERSONAL LEARNING AGENT · VERIFIED PATH
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-mono text-[10.5px] uppercase tracking-wider text-neutral-500">
                CERTIFICATE OF COMPLETION
              </p>
              <p className="font-mono text-[13px] font-bold tracking-wide text-neutral-900">
                № {certificate.credentialId}
              </p>
            </div>
          </div>

          <div className="my-6 border-b border-neutral-200" />
        </div>

        {/* Center Section */}
        <div className="my-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-600">
            THIS CERTIFIES THAT
          </p>

          <h1 className="my-3 font-display text-3xl font-light tracking-tight text-neutral-900 sm:text-5xl">
            {certificate.recipientName}
          </h1>

          <div className="mb-4 inline-block rounded-full bg-neutral-200/80 px-3 py-0.5 font-mono text-[9.5px] uppercase tracking-widest text-neutral-600">
            PUBLIC RECIPIENT RECORD
          </div>

          <p className="mb-4 text-[13.5px] italic text-neutral-600">
            has successfully completed all sections of the verified curriculum
          </p>

          <h2 className="mb-4 text-2xl font-bold text-neutral-900 sm:text-3xl">
            {certificate.courseSubject}
          </h2>

          {/* Decorative Teal Diamond Divider */}
          <div className="my-5 flex w-44 items-center justify-center gap-2.5 mx-auto text-teal-600">
            <div className="h-[1.5px] flex-1 bg-teal-500" />
            <div className="h-2 w-2 rotate-45 border-[1.5px] border-teal-500 bg-[#fbfbfa]" />
            <div className="h-[1.5px] flex-1 bg-teal-500" />
          </div>

          <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-600">
            {certificate.sectionsCount} SECTIONS · {certificate.hoursCount} HOURS ·{' '}
            {certificate.levelLabel} · ISSUED {certificate.issuedDate}
          </p>
        </div>

        {/* Bottom Footer */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6 border-t border-neutral-200 pt-6">
          <div className="space-y-1">
            <p className="text-[12px] font-medium text-neutral-900">
              <span className="font-semibold">Sawari</span>{' '}
              <span className="text-teal-600">·</span>{' '}
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-neutral-600">
                AUTONOMOUS PATH
              </span>
            </p>
            <p className="text-[11px] italic text-neutral-600">
              "A personal learning path you can actually finish."
            </p>
            <p className="font-mono text-[10px] text-neutral-500">
              Archival Hash: <span className="text-neutral-700">{certificate.archivalHash}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right space-y-0.5">
              <p className="font-mono text-[9.5px] uppercase tracking-wider text-neutral-500">
                INSTANT VERIFICATION
              </p>
              <p className="font-mono text-[11px] font-medium text-neutral-900">
                {shortVerificationUrl}
              </p>
              <p className="text-[9.5px] text-neutral-500">
                Scan to inspect audit log & completed topics
              </p>
            </div>
            <div className="border border-neutral-300 bg-white p-1">
              <CredentialQr value={certificate.verificationUrl} size={50} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
