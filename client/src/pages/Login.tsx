import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  LuArrowLeft,
  LuCheck,
  LuEye,
  LuEyeOff,
  LuLoaderCircle,
  LuMailCheck,
  LuRotateCcw,
  LuSparkles,
} from 'react-icons/lu'
import { FaGithub, FaGoogle } from 'react-icons/fa6'
import { useApp } from '../state/store'
import { useAlert } from '../state/alertContext'
import { loadLastAuth, type LastAuth } from '../lib/lastAuth'
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

type Mode = 'signin' | 'signup' | 'forgot'

export function LoginPage() {
  const { state, login, register, verifyEmail, resendVerificationCode, forgotPassword } = useApp()
  const alert = useAlert()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const returnTo = searchParams.get('returnTo') || '/app/today'
  const draftedSubject = searchParams.get('subject') || state.setup.subject

  const [lastAuth] = useState<LastAuth | null>(() => loadLastAuth())
  const lastUsedEmail = lastAuth?.method === 'email'

  const [mode, setMode] = useState<Mode>('signin')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState(lastAuth?.email ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)

  // 6-digit email verification state
  const [verificationPending, setVerificationPending] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [code, setCode] = useState('')
  const [verifyBusy, setVerifyBusy] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Password reset request state
  const [forgotSent, setForgotSent] = useState(false)

  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot'
  const passwordOk = passwordRules.every((rule) => rule.test(password))

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const switchMode = (next: Mode) => {
    setMode(next)
    setPassword('')
    setShowPassword(false)
    setForgotSent(false)
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

    if (isForgot) {
      setBusy(true)
      try {
        await forgotPassword(email.trim())
        setForgotSent(true)
      } catch (error) {
        alert.fromError(error)
      } finally {
        setBusy(false)
      }
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
        setVerificationPending(true)
        setVerificationEmail(email.trim())
        setResendCooldown(30)
        alert.success('Account created! Please enter your 6-digit verification code.')
      } else {
        const user = await login(email.trim(), password)
        if (!user.emailVerified) {
          setVerificationPending(true)
          setVerificationEmail(email.trim())
          setResendCooldown(30)
          alert.info('Please verify your email address to continue.')
          return
        }
        alert.success(`Welcome back, ${user.firstName}.`)
        navigate(returnTo, { replace: true })
      }
    } catch (error) {
      alert.fromError(error)
    } finally {
      setBusy(false)
    }
  }

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) {
      alert.error('Please enter the full 6-digit code.')
      return
    }

    setVerifyBusy(true)
    try {
      await verifyEmail(code.trim())
      alert.success('Email verified! Setting up your customized learning path...')
      navigate(returnTo, { replace: true })
    } catch (error) {
      alert.fromError(error)
    } finally {
      setVerifyBusy(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    try {
      await resendVerificationCode()
      alert.success('A new 6-digit verification code has been sent.')
      setResendCooldown(30)
    } catch (error) {
      alert.fromError(error)
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
          {/* Banner when learner drafted a path as guest */}
          {draftedSubject && !verificationPending && !isForgot && (
            <div className="mb-6 rounded-2xl border border-accent-bright/30 bg-accent-bright/10 p-4.5 text-xs text-on-band backdrop-blur">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-bright/20 text-accent-bright">
                  <LuSparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-on-band">
                    Your path for "{draftedSubject}" is drafted!
                  </p>
                  <p className="mt-1 leading-relaxed text-on-band-muted">
                    {isSignup
                      ? 'Create your account below to start generating your custom syllabus with AI.'
                      : 'Sign in to generate your drafted learning path.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {verificationPending ? (
            /* ------------------ 6-Digit Verification Step ------------------ */
            <div>
              <p className="font-mono text-sm uppercase tracking-wide text-accent-bright">
                Check your inbox
              </p>
              <h1 className="mt-3 text-[28px] font-normal leading-[1.08] tracking-[-0.04em] text-on-band sm:text-[40px]">
                Verify your email.
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-on-band-muted">
                We sent a 6-digit verification code to{' '}
                <strong className="text-on-band">{verificationEmail || email}</strong>. Enter it below to activate your account.
              </p>

              <div className="mt-8 border border-on-band/15 bg-band-soft/60 p-6 backdrop-blur sm:p-7">
                <form onSubmit={handleVerify} className="space-y-6">
                  <div className="space-y-2 text-center">
                    <label htmlFor="verify-code" className="block text-sm font-medium text-on-band">
                      Enter 6-digit code
                    </label>
                    <input
                      id="verify-code"
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full border border-on-band/20 bg-band px-4 py-3.5 text-center font-mono text-3xl font-bold tracking-[12px] text-on-band transition-colors focus:border-accent-bright focus:outline-none focus:ring-2 focus:ring-accent-bright/25"
                    />
                    <p className="text-[12px] text-on-band-dim">
                      Valid for 15 minutes. Check spam if not found in inbox.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={verifyBusy || code.length !== 6}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 bg-cream px-6 text-sm font-bold uppercase tracking-wide text-band transition-colors duration-150 hover:bg-white disabled:pointer-events-none disabled:opacity-60"
                  >
                    {verifyBusy ? (
                      <LuLoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <LuCheck className="h-4 w-4" /> Verify & Continue
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between border-t border-on-band/10 pt-4 text-xs text-on-band-muted">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className="inline-flex items-center gap-1 font-medium text-accent-bright hover:underline disabled:opacity-50"
                    >
                      <LuRotateCcw className="h-3.5 w-3.5" />
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setVerificationPending(false)}
                      className="inline-flex items-center gap-1 hover:text-on-band"
                    >
                      <LuArrowLeft className="h-3.5 w-3.5" /> Back
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : isForgot ? (
            /* ---------------- Forgot Password ---------------- */
            <div>
              <p className="font-mono text-sm uppercase tracking-wide text-accent-bright">
                Reset your password
              </p>
              <h1 className="mt-3 text-[28px] font-normal leading-[1.08] tracking-[-0.04em] text-on-band sm:text-[40px]">
                {forgotSent ? 'Check your inbox.' : 'Forgot your password?'}
              </h1>

              {forgotSent ? (
                <>
                  <p className="mt-4 text-[15px] leading-relaxed text-on-band-muted">
                    If an account exists for{' '}
                    <strong className="text-on-band">{email.trim()}</strong>, we sent a link to reset
                    your password. It expires in 1 hour.
                  </p>
                  <div className="mt-8 border border-on-band/15 bg-band-soft/60 p-6 backdrop-blur sm:p-7">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-bright/15 text-accent-bright">
                        <LuMailCheck className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-on-band">Reset link sent</p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-on-band-muted">
                          Didn't get it? Check your spam folder, or send another link.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForgotSent(false)}
                      className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 border border-on-band/20 bg-band text-sm font-medium text-on-band transition-colors duration-150 hover:border-on-band/35 hover:bg-band-soft"
                    >
                      <LuRotateCcw className="h-4 w-4" /> Send another link
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-4 text-[15px] leading-relaxed text-on-band-muted">
                    Enter the email you signed up with and we'll send you a link to choose a new
                    password.
                  </p>
                  <div className="mt-8 border border-on-band/15 bg-band-soft/60 p-6 backdrop-blur sm:p-7">
                    <form onSubmit={submit} className="space-y-5">
                      <div className="space-y-2">
                        <label
                          htmlFor="forgot-email"
                          className="block text-sm font-medium text-on-band"
                        >
                          Email
                        </label>
                        <input
                          id="forgot-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                          placeholder="you@example.com"
                          className={darkInput}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 bg-cream px-6 text-sm font-bold uppercase tracking-wide text-band transition-colors duration-150 hover:bg-white disabled:pointer-events-none disabled:opacity-60"
                      >
                        {busy ? (
                          <LuLoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          'Send reset link'
                        )}
                      </button>
                    </form>
                  </div>
                </>
              )}

              <p className="mt-6 text-sm text-on-band-muted">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="inline-flex items-center gap-1 font-medium text-accent-bright transition-colors hover:text-on-band"
                >
                  <LuArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </button>
              </p>
            </div>
          ) : (
            /* ---------------- Sign In / Sign Up Form ---------------- */
            <div>
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
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <label htmlFor="login-email" className="block text-sm font-medium text-on-band">
                          Email
                        </label>
                        {!isSignup && !isForgot && lastUsedEmail && (
                          <span className="rounded-full bg-accent-bright/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-bright">
                            Last used
                          </span>
                        )}
                      </span>
                    </div>
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
                    <div className="flex items-center justify-between">
                      <label htmlFor="login-password" className="block text-sm font-medium text-on-band">
                        Password
                      </label>
                      {!isSignup && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-[12.5px] font-medium text-accent-bright transition-colors hover:text-on-band hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
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
                      className="relative inline-flex h-11 items-center justify-center gap-2 border border-on-band/20 bg-band text-sm font-medium text-on-band transition-colors duration-150 hover:border-on-band/35 hover:bg-band-soft"
                    >
                      <FaGithub className="h-4 w-4" />
                      GitHub
                      {lastAuth?.method === 'github' && (
                        <span className="absolute -top-2.5 right-2 rounded-full bg-accent-bright px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-band">
                          Last used
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => startOAuth('google')}
                      className="relative inline-flex h-11 items-center justify-center gap-2 border border-on-band/20 bg-band text-sm font-medium text-on-band transition-colors duration-150 hover:border-on-band/35 hover:bg-band-soft"
                    >
                      <FaGoogle className="h-4 w-4" />
                      Google
                      {lastAuth?.method === 'google' && (
                        <span className="absolute -top-2.5 right-2 rounded-full bg-accent-bright px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-band">
                          Last used
                        </span>
                      )}
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
          )}
        </div>
      </main>

      <footer className="relative z-10 px-5 py-6 sm:px-10">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-[13px] text-on-band-dim">
            Your account is stored securely. Personalized learning paths are generated with DeepSeek AI.
          </p>
        </div>
      </footer>
    </div>
  )
}
