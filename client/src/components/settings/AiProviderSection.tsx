import { useState } from 'react'
import type { AiProviderId } from '../../types'
import { useApp } from '../../state/store'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { inputClass } from '../ui/ProgressBar'
import { monoLabel } from '../layout/nav'
import { cx } from '../../lib/utils'

const providers: { id: AiProviderId; name: string; hint: string }[] = [
  { id: 'openai', name: 'OpenAI', hint: 'GPT models, strong all rounder' },
  { id: 'gemini', name: 'Gemini', hint: 'Google models, long context' },
  { id: 'deepseek', name: 'DeepSeek', hint: 'Fast and inexpensive' },
]

export function AiProviderSection() {
  const { state, updateAi, toast } = useApp()
  const ai = state.settings.ai

  const [key, setKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pricingOpen, setPricingOpen] = useState(false)

  const saveKey = () => {
    const trimmed = key.trim()
    if (trimmed.length < 8) {
      setError('That key looks too short. Copy the full key from your provider.')
      return
    }
    setError('')
    setBusy(true)
    window.setTimeout(() => {
      const masked = `${trimmed.slice(0, 3)}••••••${trimmed.slice(-4)}`
      updateAi({ mode: 'own', provider: ai.provider, keyMasked: masked, connected: true })
      setBusy(false)
      setKey('')
      toast('API key saved in this browser')
    }, 900)
  }

  const removeKey = () => {
    updateAi({ keyMasked: null, connected: false })
    toast('API key removed')
  }

  const testConnection = () => {
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      toast('Connection looks good')
    }, 800)
  }

  return (
    <div className="max-w-xl space-y-6">
      <SectionHeading
        title="AI provider"
        description="Sawari uses a model to write session notes and react to your answers. Choose how it runs."
      />

      {/* mode */}
      <div className="grid gap-3 sm:grid-cols-2">
        <ModeCard
          selected={ai.mode === 'managed'}
          onClick={() => {
            updateAi({ mode: 'managed', connected: true })
            toast('Using managed AI')
          }}
          title="Use managed AI"
          body="No setup. One subscription, we handle the model and the limits."
          badge={ai.mode === 'managed' ? 'Current' : '$8/mo'}
        />
        <ModeCard
          selected={ai.mode === 'own'}
          onClick={() => updateAi({ mode: 'own' })}
          title="Use my own API key"
          body="Free. You bring a key from your provider and keep your own account."
          badge={ai.mode === 'own' ? 'Current' : 'Free'}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setPricingOpen(true)}>
          Compare the two options
        </Button>
        <span className="text-[13px] text-on-band-dim">Simulated for now. Nothing is billed.</span>
      </div>

      {/* provider */}
      <div className="border-t border-on-band/10 pt-6">
        <h3 className="text-sm font-medium text-on-band">Provider</h3>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {providers.map((provider) => {
            const selected = ai.provider === provider.id
            return (
              <button
                key={provider.id}
                onClick={() => updateAi({ provider: provider.id })}
                aria-pressed={selected}
                className={cx(
                  'border px-4 py-3 text-left transition-colors duration-150',
                  selected
                    ? 'border-accent-bright/60 bg-accent-bright/10'
                    : 'border-on-band/20 hover:border-on-band/45 hover:bg-on-band/[0.03]',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-on-band">{provider.name}</span>
                  {selected && (
                    <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 bg-accent-bright" />
                  )}
                </span>
                <span className="mt-0.5 block text-[13px] text-on-band-dim">{provider.hint}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* key */}
      <div className="border-t border-on-band/10 pt-6">
        <h3 className="text-sm font-medium text-on-band">API key</h3>

        {ai.mode === 'managed' ? (
          <div className="mt-3 border border-on-band/15 bg-panel px-4 py-4">
            <p className="text-sm font-medium text-on-band">Managed AI is on</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-on-band-dim">
              Sessions use the Sawari plan. No key needed, limits reset monthly.
            </p>
          </div>
        ) : (
          <div className="mt-3">
            {ai.keyMasked ? (
              <div className="border border-on-band/15 bg-panel px-4 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-on-band">{ai.keyMasked}</p>
                    <p className="text-[13px] text-on-band-dim">
                      Saved in this browser · {providers.find((p) => p.id === ai.provider)?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={testConnection} disabled={busy}>
                      {busy ? 'Testing…' : 'Test connection'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={removeKey}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-on-band/15 bg-panel p-4">
                <label htmlFor="api-key" className="mb-2 block text-sm font-medium text-on-band">
                  Paste your {providers.find((p) => p.id === ai.provider)?.name} key
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
                  <Button onClick={saveKey} disabled={busy} className="shrink-0">
                    {busy ? 'Saving…' : 'Save key'}
                  </Button>
                </div>
                {error && <p className="mt-2 text-[13px] text-danger-bright">{error}</p>}
                <p className="mt-2 text-[13px] text-on-band-dim">
                  Saved keys are shown masked and stay in this browser. Nothing leaves the page
                  yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
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

function ModeCard({
  selected,
  onClick,
  title,
  body,
  badge,
}: {
  selected: boolean
  onClick: () => void
  title: string
  body: string
  badge: string
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        'border p-4 text-left transition-colors duration-150',
        selected
          ? 'border-accent-bright/60 bg-accent-bright/10'
          : 'border-on-band/20 hover:border-on-band/45 hover:bg-on-band/[0.03]',
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-on-band">{title}</span>
        <span
          className={cx(
            monoLabel,
            'shrink-0 border px-2 py-0.5',
            selected
              ? 'border-accent-bright bg-accent-bright text-band'
              : 'border-on-band/20 text-on-band-dim',
          )}
        >
          {badge}
        </span>
      </span>
      <span className="mt-1.5 block text-[13px] leading-relaxed text-on-band-dim">{body}</span>
    </button>
  )
}

function PricingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, updateAi, toast } = useApp()
  const [busy, setBusy] = useState(false)
  const ai = state.settings.ai

  const chooseManaged = () => {
    setBusy(true)
    window.setTimeout(() => {
      updateAi({ mode: 'managed', connected: true, keyMasked: null })
      setBusy(false)
      onClose()
      toast('Managed AI is on')
    }, 900)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Two ways to run Sawari AI"
      description="Switch whenever you like. Nothing is billed in this prototype."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-on-band/15 p-5">
          <p className="text-sm font-medium text-on-band">Your own API key</p>
          <p className="mt-1 font-display text-[24px] font-light text-on-band">
            Free
            <span className="font-sans text-sm font-normal text-on-band-dim"> + your provider costs</span>
          </p>
          <ul className="mt-4 space-y-2.5">
            {[
              'You hold the key, we never see it',
              'Works with OpenAI, Gemini or DeepSeek',
              'Usage is billed to your provider account',
              'Good if you already pay for a model',
            ].map((line) => (
              <li key={line} className="flex gap-2.5 text-sm text-on-band-muted">
                <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 bg-success-bright" />
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                updateAi({ mode: 'own', connected: Boolean(ai.keyMasked) })
                onClose()
                toast('Using your own API key')
              }}
            >
              Use my own key
            </Button>
          </div>
        </div>

        <div className="border border-accent-bright/40 bg-accent-bright/10 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-on-band">Managed AI</p>
            {ai.mode === 'managed' && (
              <span className={cx(monoLabel, 'bg-accent-bright px-2 py-0.5 text-band')}>Current</span>
            )}
          </div>
          <p className="mt-1 font-display text-[24px] font-light text-on-band">
            $8<span className="font-sans text-sm font-normal text-on-band-dim"> / month</span>
          </p>
          <ul className="mt-4 space-y-2.5">
            {[
              'No setup, no key to manage',
              'One account, one predictable bill',
              'Built for daily sessions and reviews',
              'Cancel any time, keep your path',
            ].map((line) => (
              <li key={line} className="flex gap-2.5 text-sm text-on-band-muted">
                <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 bg-accent-bright" />
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <Button className="w-full" onClick={chooseManaged} disabled={busy}>
              {busy ? 'Setting up' : 'Choose managed AI'}
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-on-band-dim">
        Managed AI keeps session notes and reviews inside Sawari. Your own key sends them straight
        to your provider.
      </p>
    </Modal>
  )
}
