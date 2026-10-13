import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../state/store'
import { useAlert } from '../state/alertContext'
import { Sweep } from '../components/ui/Sweep'
import {
  AuthLayout,
  accountPoints,
  authAlt,
  authSubmit,
  monoNote,
} from '../components/auth/AuthLayout'
import { cx } from '../lib/utils'

export function DeleteAccountPage() {
  const { confirmAccountDeletion } = useApp()
  const alert = useAlert()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const confirm = async () => {
    if (busy || !token) return
    setBusy(true)
    try {
      await confirmAccountDeletion(token)
      setDone(true)
    } catch (error) {
      alert.fromError(error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      eyebrow={token ? 'Delete account' : 'Confirmation link'}
      title={
        !token
          ? 'That link is missing.'
          : done
            ? 'Account deleted.'
            : 'Delete your account?'
      }
      blurb={
        !token
          ? 'Confirmation links carry a token and can only be used once. Request a fresh one from Settings.'
          : done
            ? 'Everything is closed. Your paths and progress are kept for 30 days — the restore link is in your inbox.'
            : 'This signs you out everywhere and closes your account. Your paths and progress are kept for 30 days in case you change your mind.'
      }
      points={accountPoints}
    >
      <div>
        {!token ? (
          <p className={cx(monoNote, 'text-danger-bright')}>invalid link</p>
        ) : done ? (
          <div className="space-y-3">
            <p className={cx(monoNote, 'text-success-bright')}>deleted</p>
            <button type="button" onClick={() => navigate('/', { replace: true })} className={authAlt}>
              <Sweep tone="soft" />
              <span className="relative">Back to home</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button type="button" onClick={() => void confirm()} disabled={busy} className={authSubmit}>
              <Sweep tone="accent" />
              <span className="relative">{busy ? 'Deleting…' : 'Yes, delete my account'}</span>
            </button>
            <Link to="/login" className={authAlt}>
              <Sweep tone="soft" />
              <span className="relative">Keep my account</span>
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
