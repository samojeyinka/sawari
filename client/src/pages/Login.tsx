import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../state/store'
import { useAlert } from '../state/alertContext'
import { loadLastAuth, type LastAuth } from '../lib/lastAuth'
import { authApi, ApiError } from '../lib/api'
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

type Mode = 'signin' | 'signup' | 'forgot'

/** The heading above the form, kept short and functional. */
function FormHead({ label, title, sub }: { label: string; title: string; sub?: string }) {
  return (
    <div>
      <p className={authEyebrow}>{label}</p>
      <h1 className="mt-3 font-display text-[26px] font-light leading-[1.15] tracking-[-0.025em] text-on-band">
        {title}
      </h1>
      {sub && <p className="mt-3 text-[14.5px] leading-relaxed text-on-band-muted">{sub}</p>}
    </div>
  )
}

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
      if (error instanceof ApiError && error.code === 'account_deleted') {
        alert.error('This account was deleted. You can restore it within 30 days.')
        navigate('/restore-account', { replace: true })
        return
      }
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

  const aside = isSignup
    ? {
        eyebrow: 'Create account',
        title: 'Start learning with a plan.',
        blurb:
          'An account saves your path, your sessions and your progress, so any day you come back you know exactly where to pick up.',
      }
    : isForgot
      ? {
          eyebrow: 'Reset password',
          title: 'Get back into your path.',
          blurb:
            'Tell us the email you signed up with and we will send a link to choose a new password.',
        }
      : verificationPending
        ? {
            eyebrow: 'Verify email',
            title: 'One last step.',
            blurb: 'Confirm your email address and your path is ready to build.',
          }
        : {
            eyebrow: 'Sign in',
            title: 'Pick up where you stopped.',
            blurb:
              "Sign in to open your path, today's session and your progress. Everything you have done is exactly where you left it.",
          }

  const formLabel = isSignup
    ? 'Create account'
    : isForgot
      ? 'Reset password'
      : verificationPending
        ? 'Verify email'
        : 'Sign in'

  const formTitle = isSignup
    ? 'Start with an account.'
    : isForgot
      ? forgotSent
        ? 'Check your inbox.'
        : 'Forgot your password?'
      : verificationPending
        ? 'Check your inbox.'
        : 'Welcome back.'

  return (
    <AuthLayout
      eyebrow={aside.eyebrow}
      title={aside.title}
      blurb={aside.blurb}
      points={accountPoints}
    >
      <div className="w-full">
        {/* Banner when a learner drafted a path as a guest */}
        {draftedSubject && !verificationPending && !isForgot && (
          <div className="mb-8 border border-accent-bright/40 bg-accent-bright/10 p-4">
            <p className={cx(monoNote, 'text-accent-bright')}>path drafted</p>
            <p className="mt-2 text-[14.5px] font-medium text-on-band">
              Your path for “{draftedSubject}” is ready to build.
            </p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-on-band-muted">
              {isSignup
                ? 'Create your account and the agent will assemble the syllabus.'
                : 'Sign in and the agent will assemble the syllabus.'}
            </p>
          </div>
        )}

        {verificationPending ? (
          /* -------------------- 6-digit verification -------------------- */
          <>
            <FormHead
              label={formLabel}
              title={formTitle}
              sub={`We sent a 6-digit code to ${verificationEmail || email}. Enter it below to activate your account.`}
            />

            <form onSubmit={handleVerify} className="mt-8 space-y-6">
              <div className="space-y-2">
                <label htmlFor="verify-code" className={authLabel}>
                  Six-digit code
                </label>
                <input
                  id="verify-code"
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className={cx(authInput, 'text-center font-mono text-2xl tracking-[10px]')}
                />
                <p className="text-[12.5px] text-on-band-dim">
                  Valid for 15 minutes. Check spam if it has not arrived.
                </p>
              </div>

              <button type="submit" disabled={verifyBusy || code.length !== 6} className={authSubmit}>
                <Sweep />
                <span className="relative">{verifyBusy ? 'Verifying…' : 'Verify and continue'}</span>
              </button>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-on-band/10 pt-4">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className={cx(authLink, 'text-[13px] disabled:opacity-50 disabled:hover:text-accent-bright')}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationPending(false)}
                  className="text-[13px] text-on-band-dim transition-colors hover:text-on-band"
                >
                  Use a different email
                </button>
              </div>
            </form>
          </>
        ) : isForgot ? (
          /* ------------------------- forgot password ------------------------- */
          <>
            <FormHead
              label={formLabel}
              title={formTitle}
              sub={
                forgotSent
                  ? `If an account exists for ${email.trim()}, the reset link is on its way. It expires in one hour.`
                  : 'Enter the email you signed up with and we will send a link to choose a new password.'
              }
            />

            {forgotSent ? (
              <div className="mt-8 border border-on-band/15 bg-band-soft p-5">
                <p className={cx(monoNote, 'text-accent-bright')}>link sent</p>
                <p className="mt-2 text-[14.5px] text-on-band">Check your inbox and spam folder.</p>
                <button
                  type="button"
                  onClick={() => setForgotSent(false)}
                  className={cx(authAlt, 'mt-5')}
                >
                  Send another link
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="forgot-email" className={authLabel}>
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={authInput}
                  />
                </div>
                <button type="submit" disabled={busy} className={authSubmit}>
                  <Sweep />
                  <span className="relative">{busy ? 'Sending the link…' : 'Send reset link'}</span>
                </button>
              </form>
            )}

            <p className="mt-8 text-[13.5px] text-on-band-muted">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={authLink}
              >
                Back to sign in
              </button>
            </p>
          </>
        ) : (
          /* --------------------------- sign in / up --------------------------- */
          <>
            <FormHead
              label={formLabel}
              title={formTitle}
              sub={
                isSignup
                  ? 'Two fields and you are in. No card, nothing to cancel.'
                  : undefined
              }
            />

            <form onSubmit={submit} className="mt-8 space-y-5">
              {isSignup && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="login-first" className={authLabel}>
                      First name
                    </label>
                    <input
                      id="login-first"
                      type="text"
                      maxLength={80}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                      className={authInput}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="login-last" className={authLabel}>
                      Last name
                    </label>
                    <input
                      id="login-last"
                      type="text"
                      maxLength={80}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                      className={authInput}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="login-email" className={authLabel}>
                    Email
                  </label>
                  {!isSignup && lastUsedEmail && (
                    <span className={cx(monoNote, 'text-accent-bright')}>last used</span>
                  )}
                </div>
                <input
                  id="login-email"
                  type="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={authInput}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="login-password" className={authLabel}>
                    Password
                  </label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className={cx(monoNote, 'transition-colors hover:text-on-band')}
                    >
                      forgot password
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
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

                {isSignup && (
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
                )}
              </div>

              <button type="submit" disabled={busy} className={authSubmit}>
                <Sweep />
                <span className="relative">
                  {busy
                    ? isSignup
                      ? 'Creating your account…'
                      : 'Signing you in…'
                    : isSignup
                      ? 'Create account'
                      : 'Sign in'}
                </span>
              </button>
            </form>

            <div className="mt-8">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-on-band/15" />
                <span className={monoNote}>or continue with</span>
                <span className="h-px flex-1 bg-on-band/15" />
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {(['github', 'google'] as const).map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => startOAuth(provider)}
                    className={authAlt}
                  >
                    Continue with {provider === 'github' ? 'GitHub' : 'Google'}
                    {lastAuth?.method === provider && (
                      <span className={cx(monoNote, 'absolute right-4 text-accent-bright')}>
                        last used
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-8 text-[13.5px] text-on-band-muted">
              {isSignup ? 'Already have an account? ' : 'New here? '}
              <button
                type="button"
                onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
                className={authLink}
              >
                {isSignup ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
