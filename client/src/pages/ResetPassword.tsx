import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LuCheck, LuEye, LuEyeOff, LuLoaderCircle, LuTriangleAlert } from 'react-icons/lu'
import { useApp } from '../state/store'
import { useAlert } from '../state/alertContext'
import { Logo } from '../components/ui/Logo'
import { cx } from '../lib/utils'

const darkInput =
  'w-full border border-on-band/20 bg-band px-3.5 py-2.5 text-[15px] text-on-band ' +
  'placeholder:text-on-band-dim transition-colors duration-150 focus:border-accent-bright ' +
  'focus:outline-none focus:ring-2 focus:ring-accent-bright/25'

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
    <div className="hero-wash relative flex min-h-screen flex-col overflow-hidden">
      <div className="hero-grid absolute inset-0" aria-hidden="true" />

      <header className="relative z-10 px-5 py-5 sm:px-10">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <Link to="/" aria-label="Sawari home">
            <Logo />
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md animate-rise">
          <p className="font-mono text-sm uppercase tracking-wide text-accent-bright">
            Choose a new password
          </p>
          <h1 className="mt-3 text-[28px] font-normal leading-[1.08] tracking-[-0.04em] text-on-band sm:text-[40px]">
            Set a new password.
          </h1>

          {token ? (
            <>
              <p className="mt-4 text-[15px] leading-relaxed text-on-band-muted">
                Pick a strong password you have not used before. You will be signed in with it right
                after.
              </p>

              <div className="mt-8 border border-on-band/15 bg-band-soft/60 p-6 backdrop-blur sm:p-7">
                <form onSubmit={submit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="reset-password" className="block text-sm font-medium text-on-band">
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
                        className={cx(darkInput, 'pr-11')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-on-band-muted transition-colors hover:text-on-band"
                      >
                        {showPassword ? (
                          <LuEyeOff className="h-4 w-4" />
                        ) : (
                          <LuEye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
                      {passwordRules.map((rule) => {
                        const met = rule.test(password)
                        return (
                          <li
                            key={rule.label}
                            className={cx(
                              'flex items-center gap-1.5 text-[12.5px] transition-colors',
                              met ? 'text-success-bright' : 'text-on-band-dim',
                            )}
                          >
                            <LuCheck className={cx('h-3.5 w-3.5', !met && 'opacity-40')} />
                            {rule.label}
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="reset-confirm" className="block text-sm font-medium text-on-band">
                      Confirm new password
                    </label>
                    <input
                      id="reset-confirm"
                      type={showPassword ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={darkInput}
                    />
                    {mismatch && (
                      <p className="text-[12.5px] text-danger-bright">
                        The two passwords do not match.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={busy || !passwordOk || password !== confirm}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 bg-cream px-6 text-sm font-bold uppercase tracking-wide text-band transition-colors duration-150 hover:bg-white disabled:pointer-events-none disabled:opacity-60"
                  >
                    {busy ? (
                      <LuLoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      'Reset password'
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <p className="mt-4 text-[15px] leading-relaxed text-on-band-muted">
                This reset link is missing or invalid. Request a new one from the sign in page.
              </p>
              <div className="mt-8 border border-on-band/15 bg-band-soft/60 p-6 backdrop-blur sm:p-7">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger-bright/15 text-danger-bright">
                    <LuTriangleAlert className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-on-band">Invalid reset link</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-on-band-muted">
                      Reset links expire after 1 hour and can only be used once.
                    </p>
                  </div>
                </div>
                <Link
                  to="/login"
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 border border-on-band/20 bg-band text-sm font-medium text-on-band transition-colors duration-150 hover:border-on-band/35 hover:bg-band-soft"
                >
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="relative z-10 px-5 py-6 sm:px-10">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-[13px] text-on-band-dim">
            Your account is stored securely. Personalized learning paths are generated with DeepSeek
            AI.
          </p>
        </div>
      </footer>
    </div>
  )
}
