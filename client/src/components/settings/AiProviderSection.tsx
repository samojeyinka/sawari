import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../state/store'
import { billingApi } from '../../lib/api'
import { Button } from '../ui/Button'
import { inputClass } from '../ui/ProgressBar'
import { monoLabel } from '../layout/nav'
import { cx } from '../../lib/utils'

/* PayPal JS SDK (injected via script tag — public client id only). */
const PAYPAL_CLIENT_ID = (import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined) ?? ''

interface PaypalButtonActions {
  render(target: HTMLElement): Promise<void>
  close(): Promise<void>
}

interface PaypalSdk {
  Buttons(options: {
    style?: Record<string, unknown>
    createOrder: () => Promise<string>
    onApprove: (data: { orderID: string }) => Promise<void>
    onCancel?: () => void
    onError?: (err: unknown) => void
  }): PaypalButtonActions
}

function paypalSdk(): PaypalSdk | null {
  return (window as unknown as { paypal?: PaypalSdk }).paypal ?? null
}

function loadPaypalSdk(clientId: string): Promise<void> {
  if (paypalSdk()) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('PayPal could not be loaded. Check your connection and try again.'))
    document.head.appendChild(script)
  })
}

export function AiProviderSection() {
  const { state, toast, refreshBilling } = useApp()
  const billing = state.billing

  const [key, setKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [keyBusy, setKeyBusy] = useState(false)
  const [keyError, setKeyError] = useState('')

  const [payState, setPayState] = useState<'idle' | 'loading' | 'ready' | 'approving' | 'error'>('idle')
  const [payError, setPayError] = useState('')
  const [billingLoading, setBillingLoading] = useState(false)
  const buttonsRef = useRef<HTMLDivElement>(null)
  const buttonsInstance = useRef<PaypalButtonActions | null>(null)

  const isPro = billing?.plan === 'pro'
  const hasKey = Boolean(billing?.hasOwnKey)
  const paypalOn = Boolean(billing?.paypalConfigured && PAYPAL_CLIENT_ID)

  // Billing can land as null when the first load raced a restart — refresh on
  // arrival so the section never gets stuck showing "unavailable".
  useEffect(() => {
    let cancelled = false
    setBillingLoading(true)
    void refreshBilling()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setBillingLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refreshBilling])

  const saveKey = async () => {
    const trimmed = key.trim()
    if (trimmed.length < 10) {
      setKeyError('Paste the full key from DeepSeek (platform.deepseek.com).')
      return
    }
    setKeyError('')
    setKeyBusy(true)
    try {
      await billingApi.saveAiKey(trimmed)
      setKey('')
      await refreshBilling()
      toast('Key verified — your generations now run on it.')
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : 'That key did not verify.')
    } finally {
      setKeyBusy(false)
    }
  }

  const removeKey = async () => {
    setKeyBusy(true)
    try {
      await billingApi.removeAiKey()
      await refreshBilling()
      toast('API key removed')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not remove the key.')
    } finally {
      setKeyBusy(false)
    }
  }

  // Render PayPal buttons once the SDK is ready and payment still applies.
  useEffect(() => {
    if (!paypalOn || isPro) return
    let cancelled = false
    setPayState('loading')
    setPayError('')
    loadPaypalSdk(PAYPAL_CLIENT_ID)
      .then(() => {
        if (cancelled || !buttonsRef.current) return
        const sdk = paypalSdk()
        if (!sdk) throw new Error('PayPal could not be loaded.')
        buttonsInstance.current?.close().catch(() => undefined)
        buttonsInstance.current = sdk.Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },
          createOrder: async () => {
            const { orderId } = await billingApi.createOrder()
            return orderId
          },
          onApprove: async (data) => {
            setPayState('approving')
            try {
              await billingApi.captureOrder(data.orderID)
              await refreshBilling()
              toast('Welcome to Pro — up to 5 learning paths.')
            } catch (err) {
              setPayError(err instanceof Error ? err.message : 'Payment did not complete.')
              setPayState('error')
            }
          },
          onCancel: () => setPayState('ready'),
          onError: (err) => {
            setPayError(err instanceof Error ? err.message : 'PayPal checkout failed.')
            setPayState('error')
          },
        })
        return buttonsInstance.current.render(buttonsRef.current)
      })
      .then(() => {
        if (!cancelled) setPayState('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setPayError(err instanceof Error ? err.message : 'PayPal checkout failed.')
        setPayState('error')
      })
    return () => {
      cancelled = true
      buttonsInstance.current?.close().catch(() => undefined)
      buttonsInstance.current = null
    }
  }, [paypalOn, isPro, refreshBilling, toast])

  return (
    <div className="max-w-xl space-y-6">
      <SectionHeading
        title="AI provider"
        description="Generations run on Sawari's model by default. Go Pro or connect your own DeepSeek key for up to 5 learning paths."
      />

      {/* current plan */}
      <div className="border border-on-band/15 bg-panel px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={cx(monoLabel, isPro ? 'text-accent-bright' : 'text-on-band-dim')}>
            {isPro ? 'pro · one-time' : hasKey ? 'own deepseek key' : 'free'}
          </p>
          {billing && (
            <p className={monoLabel}>
              {billing.pathsUsed} of {billing.pathLimit} paths used
            </p>
          )}
        </div>
      </div>

      {/* option 1: Pro */}
      <div className="border-t border-on-band/10 pt-6">
        <h3 className="text-sm font-medium text-on-band">Sawari Pro</h3>
        {isPro ? (
          <div className="mt-3 border border-accent-bright/40 bg-accent-bright/10 px-4 py-3.5">
            <p className="text-sm font-medium text-on-band">Pro is active</p>
            <p className="mt-0.5 text-[13px] text-on-band-dim">
              Up to 5 learning paths on Sawari&apos;s model.
              {billing?.proPaidAt && ` Paid ${billing.proPaidAt.slice(0, 10)}.`}
            </p>
          </div>
        ) : (
          <div className="mt-3 border border-on-band/15 bg-panel p-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="font-display text-[24px] font-light text-on-band">
                $6<span className="font-sans text-sm font-normal text-on-band-dim"> one-time</span>
              </p>
              <p className={monoLabel}>up to 5 paths</p>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-on-band-dim">
              One payment, yours forever. No subscription, no renewals.
            </p>

            {billing?.paypalMode === 'sandbox' && (
              <p className={cx(monoLabel, 'mt-3 text-warn-bright')}>sandbox checkout — no real money moves</p>
            )}

            <div className="mt-4">
              {billingLoading && !billing ? (
                <p className={monoLabel}>loading checkout…</p>
              ) : paypalOn ? (
                <>
                  <div ref={buttonsRef} className="min-h-12" />
                  {payState === 'loading' && (
                    <p className={cx(monoLabel, 'mt-2')}>loading secure checkout…</p>
                  )}
                  {payState === 'approving' && (
                    <p className={cx(monoLabel, 'mt-2 text-accent-bright')}>confirming payment…</p>
                  )}
                  {payState === 'error' && payError && (
                    <p className="mt-2 text-[13px] text-danger-bright">{payError}</p>
                  )}
                </>
              ) : (
                <p className="text-[13px] text-on-band-dim">
                  Card checkout is unavailable right now. You can still connect your own key below.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* option 2: own key */}
      <div className="border-t border-on-band/10 pt-6">
        <h3 className="text-sm font-medium text-on-band">Your own DeepSeek key</h3>

        <div className="mt-3">
          {hasKey ? (
            <div className="border border-on-band/15 bg-panel px-4 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-on-band">{billing?.aiKeyLast4 ?? '••••'}</p>
                  <p className="text-[13px] text-on-band-dim">
                    Verified · generations run on your key · up to 5 paths
                  </p>
                </div>
                <Button size="sm" variant="danger" onClick={() => void removeKey()} disabled={keyBusy}>
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="border border-on-band/15 bg-panel p-4">
              <label htmlFor="api-key" className="mb-2 block text-sm font-medium text-on-band">
                Paste your DeepSeek key
              </label>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <input
                    id="api-key"
                    type={showKey ? 'text' : 'password'}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="sk-..."
                    autoComplete="off"
                    className={cx(inputClass, 'pr-16 font-mono')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    aria-label={showKey ? 'Hide key' : 'Show key'}
                    className={cx(
                      monoLabel,
                      'absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-on-band',
                    )}
                  >
                    {showKey ? 'hide' : 'show'}
                  </button>
                </div>
                <Button onClick={() => void saveKey()} disabled={keyBusy} className="shrink-0">
                  {keyBusy ? 'Verifying…' : 'Save key'}
                </Button>
              </div>
              {keyError && <p className="mt-2 text-[13px] text-danger-bright">{keyError}</p>}
              <p className="mt-2 text-[13px] text-on-band-dim">
                We check the key with DeepSeek, then store only an encrypted copy. Find yours at
                platform.deepseek.com.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="font-display text-[20px] font-light tracking-[-0.015em] text-on-band">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-on-band-muted">{description}</p>
    </div>
  )
}
