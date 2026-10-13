import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../state/store'
import { useAlert } from '../state/alertContext'
import { Sweep } from '../components/ui/Sweep'
import {
  AuthLayout,
  accountPoints,
  authAlt,
  authEyebrow,
  authInput,
  authLabel,
  authLink,
  authSubmit,
  monoNote,
} from '../components/auth/AuthLayout'
import { cx } from '../lib/utils'

const passwordRules = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'An uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'A lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { label: 'A number', test: (v: string) => /[0-9]/.test(v) },
  { label: 'A symbol', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

export function ResetPasswordPage() {
  const { resetPassword } = useApp()
  const alert = useAlert()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)

  const passwordOk = passwordRules.every((rule) => rule.test(password))
  const mismatch = confirm.length > 0 && confirm !== password

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!passwordOk) {
      alert.error('Your password does not meet all the requirements yet.')
      return
    }
    if (password !== confirm) {
      alert.error('The two passwords do not match.')
      return
    }

    setBusy(true)
    try {
      await resetPassword(token, password)
      alert.success('Password reset. Sign in with your new password.')
      navigate('/login', { replace: true })
    } catch (error) {
      alert.fromError(error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      eyebrow={token ? 'Choose a new password' : 'Reset link'}
      title={token ? 'Set a new password.' : 'That link has expired.'}
      blurb={
        token
          ? 'Pick a strong password you have not used before. You will be signed in with it right after.'
          : 'Reset links are valid for one hour and can only be used once. Request a fresh one from the sign in page.'
      }
      points={accountPoints}
    >
      <div className="w-full">
        <div>
          <p className={authEyebrow}>{token ? 'New password' : 'Invalid link'}</p>
          <h1 className="mt-3 font-display text-[26px] font-light leading-[1.15] tracking-[-0.025em] text-on-band">
            {token ? 'Choose your new password.' : 'We cannot use this link.'}
          </h1>
        </div>

        {token ? (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label htmlFor="reset-password" className={authLabel}>
                New password
              </label>
              <div className="relative">
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  autoFocus
                  className={cx(authInput, 'pr-20')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={cx(
                    monoNote,
                    'absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-on-band',
                  )}
                >
                  {showPassword ? 'hide' : 'show'}
                </button>
              </div>

              <ul className="grid grid-cols-1 gap-1.5 pt-2 sm:grid-cols-2">
                {passwordRules.map((rule) => {
                  const met = rule.test(password)
                  return (
                    <li
                      key={rule.label}
                      className={cx(
                        'flex items-center gap-2 text-[12.5px] transition-colors',
                        met ? 'text-accent-bright' : 'text-on-band-dim',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cx(
                          'h-2.5 w-2.5 shrink-0 border transition-colors',
                          met ? 'border-accent-bright bg-accent-bright' : 'border-on-band/25',
                        )}
                      />
                      {rule.label}
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="space-y-2">
              <label htmlFor="reset-confirm" className={authLabel}>
                Confirm new password
              </label>
              <input
                id="reset-confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                className={authInput}
              />
              {mismatch && (
                <p className="text-[12.5px] text-danger-bright">
                  The two passwords do not match.
                </p>
              )}
            </div>

            <button type="submit" disabled={busy || !passwordOk || password !== confirm} className={authSubmit}>
              <Sweep />
              <span className="relative">{busy ? 'Saving…' : 'Reset password'}</span>
            </button>
          </form>
        ) : (
          <div className="mt-8 border border-on-band/15 bg-band-soft p-5">
            <p className={cx(monoNote, 'text-danger-bright')}>link expired</p>
            <p className="mt-2 text-[14.5px] leading-relaxed text-on-band-muted">
              Open the reset email again, or ask for a new link from the sign in page.
            </p>
            <Link to="/login" className={cx(authAlt, 'mt-5')}>
              Back to sign in
            </Link>
          </div>
        )}

        {token && (
          <p className="mt-8 text-[13.5px] text-on-band-muted">
            Remembered it?{' '}
            <Link to="/login" className={authLink}>
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  )
}
