import { CredentialQr } from '../ui/CredentialQr'
import { Logo } from '../ui/Logo'
import type { ApiCertificate } from '../../lib/api'

export function CertificateCard({ certificate }: { certificate: ApiCertificate }) {
  const shortVerificationUrl = certificate.verificationUrl.replace(/^https?:\/\//, '')

  return (
    <div className="relative mx-auto w-full max-w-[1040px] rounded-2xl border border-[#dfd4e9] bg-[#f8f5fa] p-2 shadow-[0_20px_55px_rgba(45,31,60,0.12)] sm:p-4 print:max-w-none print:rounded-none print:border-[#b9aebe] print:p-2 print:shadow-none">
      <article className="relative flex min-h-[590px] flex-col justify-between overflow-hidden rounded-xl border border-[#e5dcec] bg-white p-6 sm:p-10 print:min-h-0 print:rounded-none print:p-8">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#d8c4ed] via-[#713bd1] to-[#c8e5e2] print:bg-[#713bd1]" />
        <header className="flex items-start justify-between gap-4 border-b border-[#eeeaf1] pb-5 sm:pb-6">
          <div className="flex min-w-0 items-center gap-3">
            <Logo size="sm" />
            <div className="min-w-0 border-l border-[#e8e4ec] pl-3">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#30283b]">Verified learning credential</p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#918a99]">A completed Sawari learning path</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#918a99]">Certificate ID</p>
            <p className="mt-1 break-all text-[11px] font-extrabold text-[#30283b]">{certificate.credentialId}</p>
          </div>
        </header>

        <section className="my-8 text-center sm:my-10">
          <span className="inline-flex rounded-full border border-[#e7def1] bg-[#faf7fd] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#713bd1]">Certificate of completion</span>
          <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#77717e]">Awarded to</p>
          <h1 className="mx-auto mt-2 max-w-[800px] break-words text-3xl font-extrabold leading-tight tracking-[-0.045em] text-[#211b2a] sm:text-5xl">{certificate.recipientName}</h1>
          <p className="mt-4 text-[13px] leading-6 text-[#625c67]">for successfully completing every section of</p>
          <h2 className="mx-auto mt-2 max-w-[800px] text-2xl font-extrabold leading-tight tracking-[-0.035em] text-[#6130ae] sm:text-3xl">{certificate.courseSubject}</h2>

          <div className="mx-auto my-6 flex w-44 items-center justify-center gap-3 text-[#713bd1]">
            <span className="h-px flex-1 bg-[#d9c8eb]" /><span className="h-2.5 w-2.5 rotate-45 border-2 border-[#713bd1] bg-white" /><span className="h-px flex-1 bg-[#d9c8eb]" />
          </div>

          <div className="mx-auto flex max-w-[780px] flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[10px] font-bold text-[#625c67] sm:text-[11px]">
            <span>{certificate.sectionsCount} sections</span><span aria-hidden="true" className="text-[#c8bfd1]">·</span>
            <span>{certificate.hoursCount} hours</span><span aria-hidden="true" className="text-[#c8bfd1]">·</span>
            <span>{certificate.levelLabel}</span><span aria-hidden="true" className="text-[#c8bfd1]">·</span>
            <span>Issued {certificate.issuedDate}</span>
          </div>
        </section>

        <footer className="flex flex-wrap items-end justify-between gap-6 border-t border-[#eeeaf1] pt-5 sm:pt-6">
          <div className="min-w-0 max-w-[580px]">
            <p className="text-[11px] font-extrabold text-[#30283b]">Sawari <span className="text-[#713bd1]">·</span> Learn at your pace. Finish what matters.</p>
            <p className="mt-1 text-[10px] leading-5 text-[#77717e]">This credential is recorded in the Sawari verification archive.</p>
            <p className="mt-2 break-all text-[9px] text-[#918a99]">Record hash: <span className="font-semibold text-[#625c67]">{certificate.archivalHash}</span></p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="max-w-[190px] text-right">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#918a99]">Verify this credential</p>
              <p className="mt-1 break-all text-[10px] font-bold text-[#30283b]">{shortVerificationUrl}</p>
              <p className="mt-1 text-[9px] leading-4 text-[#918a99]">Scan to view its public verification record.</p>
            </div>
            <div className="shrink-0 rounded-lg border border-[#e5e0e9] bg-white p-1.5"><CredentialQr value={certificate.verificationUrl} size={64} /></div>
          </div>
        </footer>
      </article>
    </div>
  )
}
