import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../state/store'
import { useAlert } from '../state/alertContext'
import { authApi } from '../lib/api'
import { Sweep } from '../components/ui/Sweep'
import {
  AuthLayout,
  accountPoints,
  authAlt,
  authInput,
  authLabel,
  authSubmit,
  monoNote,
} from '../components/auth/AuthLayout'
import { cx } from '../lib/utils'

export function RestoreAccountPage() {
  const { restoreAccount } = useApp()
  const alert = useAlert()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)

  const restore = async () => {
    if (busy || !token) return
    setBusy(true)
    try {
      await restoreAccount(token)
      alert.success('Welcome back — your account is restored.')
      navigate('/app/today', { replace: true })
    } catch (error) {
      alert.fromError(error)
    } finally {
      setBusy(false)
    }
  }

  const resend = async (e: FormEvent) => {
    e.preventDefault()
    if (resending || !email.includes('@')) {
      if (!email.includes('@')) alert.error('Enter a valid email address.')
      return
    }
    setResending(true)
    try {
      await authApi.requestRestoreLink(email.trim())
      alert.success('If that account can be restored, a link is on its way.')
    } catch (error) {
      alert.fromError(error)
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      eyebrow={token ? 'Restore account' : 'Restore link'}
      title={
        !token ? 'That link is missing.' : 'Bring your account back?'
      }
      blurb={
        !token
          ? 'Restore links carry a token and work within 30 days of deletion. Enter your email below for a fresh one.'
          : 'One click restores your account with every path, project and session intact.'
      }
      points={accountPoints}
    >
      <div>
        {!token ? (
          <p className={cx(monoNote, 'text-danger-bright')}>invalid link</p>
        ) : (
          <div className="space-y-3">
            <button type="button" onClick={() => void restore()} disabled={busy} className={authSubmit}>
              <Sweep tone="accent" />
              <span className="relative">{busy ? 'Restoring…' : 'Restore my account'}</span>
            </button>
            <Link to="/login" className={authAlt}>
              <Sweep tone="soft" />
              <span className="relative">Back to sign in</span>
            </Link>
          </div>
        )}

        <form onSubmit={resend} className="mt-8 border-t border-on-band/10 pt-6">
          <p className={monoNote}>lost your link</p>
          <label htmlFor="restore-email" className={cx(authLabel, 'mb-2 mt-3 block')}>
            Account email
          </label>
          <input
            id="restore-email"
            type="email"
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            className={authInput}
          />
          <button type="submit" disabled={resending} className={cx(authAlt, 'mt-3 w-full')}>
            <Sweep tone="soft" />
            <span className="relative">{resending ? 'Sending…' : 'Resend restore link'}</span>
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
