import { env, isPaypalConfigured } from '../config/env.js'

/* ------------------------------------------------------------------ */
/*  PayPal Checkout (Orders v2) for the one-time Pro payment.          */
/*                                                                     */
/*  Security shape:                                                    */
/*  - the amount/currency live ONLY here (env), never from the client  */
/*  - every order is tagged with custom_id = our user id              */
/*  - capture is verified server-side (status, owner, exact amount)    */
/*    before any entitlement is granted                                */
/*  - secrets never leave this module (no logging of auth/payloads)    */
/* ------------------------------------------------------------------ */

const SANDBOX_BASE = 'https://api-m.sandbox.paypal.com'
const LIVE_BASE = 'https://api-m.paypal.com'
const TOKEN_SKEW_MS = 60_000

function apiBase(): string {
  return env.PAYPAL_MODE === 'live' ? LIVE_BASE : SANDBOX_BASE
}

export class PaypalError extends Error {
  readonly status: number
  constructor(message: string, status = 502) {
    super(message)
    this.name = 'PaypalError'
    this.status = status
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null

/** Client-credentials token, cached in memory until shortly before expiry. */
async function accessToken(): Promise<string> {
  if (!isPaypalConfigured) {
    throw new PaypalError('PayPal checkout is not configured.', 503)
  }
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt > now) return cachedToken.value

  const credentials = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64')
  const response = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) {
    throw new PaypalError(`PayPal auth failed (${response.status}).`, 502)
  }
  const json = (await response.json()) as { access_token?: string; expires_in?: number }
  if (!json.access_token) throw new PaypalError('PayPal auth returned no token.', 502)
  cachedToken = {
    value: json.access_token,
    expiresAt: now + Math.max(0, (json.expires_in ?? 3600) * 1000 - TOKEN_SKEW_MS),
  }
  return cachedToken.value
}

interface PaypalAmount {
  currency_code?: string
  value?: string
}

interface PaypalCapture {
  id?: string
  status?: string
  amount?: PaypalAmount
}

interface PaypalPurchaseUnit {
  custom_id?: string
  amount?: PaypalAmount
  payments?: { captures?: PaypalCapture[] }
}

interface PaypalOrder {
  id?: string
  status?: string
  purchase_units?: PaypalPurchaseUnit[]
}

async function paypalFetch(path: string, init: RequestInit & { token: string }): Promise<PaypalOrder> {
  const { token, ...rest } = init
  const response = await fetch(`${apiBase()}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...rest.headers,
    },
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new PaypalError(
      `PayPal request failed (${response.status}). ${detail.slice(0, 120)}`.trim(),
      502,
    )
  }
  return (await response.json()) as PaypalOrder
}

/** Creates a fixed-amount CAPTURE order for the Pro upgrade. Returns the order id. */
export async function createProOrder(userId: string): Promise<{ orderId: string }> {
  const token = await accessToken()
  const order = await paypalFetch('/v2/checkout/orders', {
    token,
    method: 'POST',
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: userId,
          description: 'Sawari Pro — one-time upgrade',
          amount: { currency_code: 'USD', value: env.PRO_PRICE_USD },
        },
      ],
    }),
  })
  if (!order.id) throw new PaypalError('PayPal did not return an order id.', 502)
  return { orderId: order.id }
}

export interface VerifiedCapture {
  orderId: string
  captureId: string
  payerEmail?: string
}

/**
 * Captures the order and verifies, strictly, that PayPal says:
 * COMPLETED + owned by this user + exactly PRO_PRICE_USD/USD.
 * Throws otherwise — the caller must grant nothing on throw.
 */
export async function captureAndVerifyProOrder(orderId: string, userId: string): Promise<VerifiedCapture> {
  const token = await accessToken()
  const order = await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    token,
    method: 'POST',
    body: JSON.stringify({}),
  })

  const unit = order.purchase_units?.[0]
  if (order.status !== 'COMPLETED') {
    throw new PaypalError('Payment was not completed. No charge was made.', 400)
  }
  if (unit?.custom_id !== userId) {
    throw new PaypalError('This order does not belong to your account.', 403)
  }
  const capture = unit?.payments?.captures?.find((c) => c.status === 'COMPLETED') ?? unit?.payments?.captures?.[0]
  if (!capture || capture.status !== 'COMPLETED' || !capture.id) {
    throw new PaypalError('Payment capture is not complete. No charge was made.', 400)
  }
  if (capture.amount?.currency_code !== 'USD' || capture.amount?.value !== env.PRO_PRICE_USD) {
    throw new PaypalError('Paid amount does not match the Pro price. Contact support.', 400)
  }
  return { orderId: order.id ?? orderId, captureId: capture.id }
}

/** Testing hook: drop the cached token. */
export function resetPaypalTokenCache(): void {
  cachedToken = null
}
