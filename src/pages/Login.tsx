import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuLoaderCircle } from 'react-icons/lu'
import { useApp } from '../state/store'
import { Logo } from '../components/ui/Logo'
import { cx } from '../lib/utils'

const darkInput =
  'w-full border border-on-band/20 bg-band px-3.5 py-2.5 text-[15px] text-on-band ' +
  'placeholder:text-on-band-dim transition-colors duration-150 focus:border-accent-bright ' +
  'focus:outline-none focus:ring-2 focus:ring-accent-bright/25 hover:border-on-band/35'

export function LoginPage() {
  const { signIn } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('sam@sawari.app')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const finish = () => {
    signIn(email.trim())
    navigate('/app/today', { replace: true })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password needs at least 6 characters.')
      return
    }
    setError('')
    setBusy(true)
    window.setTimeout(finish, 700)
  }

  return (
    <div className="hero-wash relative flex min-h-screen flex-col overflow-hidden">
      <div className="hero-grid absolute inset-0" aria-hidden="true" />

      <header className="relative z-10 px-5 py-5 sm:px-10">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <Link to="/" aria-label="Sawari home">
            <Logo tone="on-band" />
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
            Welcome back
          </p>
          <h1 className="mt-3 text-[28px] font-normal leading-[1.08] tracking-[-0.04em] text-on-band sm:text-[40px]">
            Pick up where you stopped.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-on-band-muted">
            Sign in to open your path, today's session and your progress.
          </p>

          <div className="mt-8 border border-on-band/15 bg-band-soft/60 p-6 backdrop-blur sm:p-7">
            <form onSubmit={submit} className="space-y-5">
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
                  className={cx(darkInput, error && 'border-danger-bright')}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="block text-sm font-medium text-on-band">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cx(darkInput, error && 'border-danger-bright')}
                />
                {error ? (
                  <p className="text-[13px] text-danger-bright">{error}</p>
                ) : (
                  <p className="text-[13px] text-on-band-dim">Any password works in the demo.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-12 w-full items-center justify-center gap-2 bg-cream px-6 text-sm font-bold uppercase tracking-wide text-band transition-colors duration-150 hover:bg-white disabled:pointer-events-none disabled:opacity-60"
              >
                {busy ? (
                  <LuLoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-sm text-on-band-muted">
            New here?{' '}
            <Link
              to="/setup"
              className="font-medium text-accent-bright transition-colors hover:text-on-band"
            >
              Build a learning path
            </Link>
          </p>
        </div>
      </main>

      <footer className="relative z-10 px-5 py-6 sm:px-10">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-[13px] text-on-band-dim">
            Frontend prototype with mock data. Paths, sessions and reviews are simulated.
          </p>
        </div>
      </footer>
    </div>
  )
}
