import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuCheck, LuEye, LuEyeOff, LuLoaderCircle } from 'react-icons/lu'
import { FaGithub, FaGoogle } from 'react-icons/fa6'
import { useApp } from '../state/store'
import { useAlert } from '../state/alertContext'
import { authApi } from '../lib/api'
import { Logo } from '../components/ui/Logo'
import { cx } from '../lib/utils'

const darkInput =
  'w-full border border-on-band/20 bg-band px-3.5 py-2.5 text-[15px] text-on-band ' +
  'placeholder:text-on-band-dim transition-colors duration-150 focus:border-accent-bright ' +
  'focus:outline-none focus:ring-2 focus:ring-accent-bright/25 hover:border-on-band/35'

const passwordRules = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'An uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'A lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { label: 'A number', test: (v: string) => /[0-9]/.test(v) },
  { label: 'A symbol', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

type Mode = 'signin' | 'signup'

export function LoginPage() {
  const { login, register } = useApp()
  const alert = useAlert()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('signin')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)

  const isSignup = mode === 'signup'
  const passwordOk = passwordRules.every((rule) => rule.test(password))

  const switchMode = (next: Mode) => {
    setMode(next)
    setPassword('')
    setShowPassword(false)
  }

  const startOAuth = (provider: 'github' | 'google') => {
    window.location.assign(authApi.oauthUrl(provider))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return

    if (!email.includes('@')) {
      alert.error('Enter a valid email address.')
      return
    }
    if (isSignup && !firstName.trim()) {
      alert.error('Enter your first name.')
      return
    }
    if (isSignup && !passwordOk) {
      alert.error('Your password does not meet all the requirements yet.')
      return
    }
    if (!isSignup && password.length === 0) {
      alert.error('Enter your password.')
      return
    }

    setBusy(true)
    try {
      if (isSignup) {
        await register({
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          email: email.trim(),
          password,
        })
        alert.success('Account created. Welcome to Sawari.')
      } else {
        const user = await login(email.trim(), password)
        alert.success(`Welcome back, ${user.firstName}.`)
      }
      navigate('/app/today', { replace: true })
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
          <Link
            to="/setup"
            className="text-sm text-on-band-muted transition-colors hover:text-on-band"
          >
            Build a path
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md animate-rise">
          <p className="font-mono text-sm uppercase tracking-wide text-accent-bright">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </p>
          <h1 className="mt-3 text-[28px] font-normal leading-[1.08] tracking-[-0.04em] text-on-band sm:text-[40px]">
            {isSignup ? 'Start learning with a plan.' : 'Pick up where you stopped.'}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-on-band-muted">
            {isSignup
              ? 'Create an account to save your path, sessions and progress.'
              : "Sign in to open your path, today's session and your progress."}
          </p>

          <div className="mt-8 border border-on-band/15 bg-band-soft/60 p-6 backdrop-blur sm:p-7">
            <form onSubmit={submit} className="space-y-5">
              {isSignup && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="login-first" className="block text-sm font-medium text-on-band">
                      First name
                    </label>
                    <input
                      id="login-first"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                      className={darkInput}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="login-last" className="block text-sm font-medium text-on-band">
                      Last name
                    </label>
                    <input
                      id="login-last"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                      className={darkInput}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="login-email" className="block text-sm font-medium text-on-band">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={darkInput}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="block text-sm font-medium text-on-band">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
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

                {isSignup && (
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
                )}
              </div>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-12 w-full items-center justify-center gap-2 bg-cream px-6 text-sm font-bold uppercase tracking-wide text-band transition-colors duration-150 hover:bg-white disabled:pointer-events-none disabled:opacity-60"
              >
                {busy ? (
                  <LuLoaderCircle className="h-4 w-4 animate-spin" />
                ) : isSignup ? (
                  'Create account'
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-on-band-dim">
                <span className="h-px flex-1 bg-on-band/15" />
                or continue with
                <span className="h-px flex-1 bg-on-band/15" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => startOAuth('github')}
                  className="inline-flex h-11 items-center justify-center gap-2 border border-on-band/20 bg-band text-sm font-medium text-on-band transition-colors duration-150 hover:border-on-band/35 hover:bg-band-soft"
                >
                  <FaGithub className="h-4 w-4" />
                  GitHub
                </button>
                <button
                  type="button"
                  onClick={() => startOAuth('google')}
                  className="inline-flex h-11 items-center justify-center gap-2 border border-on-band/20 bg-band text-sm font-medium text-on-band transition-colors duration-150 hover:border-on-band/35 hover:bg-band-soft"
                >
                  <FaGoogle className="h-4 w-4" />
                  Google
                </button>
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm text-on-band-muted">
            {isSignup ? 'Already have an account?' : 'New here?'}{' '}
            <button
              type="button"
              onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
              className="font-medium text-accent-bright transition-colors hover:text-on-band"
            >
              {isSignup ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </main>

      <footer className="relative z-10 px-5 py-6 sm:px-10">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-[13px] text-on-band-dim">
            Your account is stored securely. Learning content is still simulated.
          </p>
        </div>
      </footer>
    </div>
  )
}
