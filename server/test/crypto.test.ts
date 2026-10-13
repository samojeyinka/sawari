import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fingerprintSecret, openSecret, sealSecret } from '../src/lib/secrets.js'

/* Pure unit tests: AES-256-GCM seal/open round-trip. No database needed. */

test('seal/open round-trips an API key', () => {
  const sealed = sealSecret('sk-abc123xyz')
  assert.notEqual(sealed, 'sk-abc123xyz')
  assert.equal(sealed.split('.').length, 3)
  assert.equal(openSecret(sealed), 'sk-abc123xyz')
})

test('sealing is randomized (same input, different bundles)', () => {
  assert.notEqual(sealSecret('sk-same'), sealSecret('sk-same'))
})

test('tampered bundles do not open', () => {
  const sealed = sealSecret('sk-abc123xyz')
  const [iv, ct, tag] = sealed.split('.')
  const flipped = `${iv}.${ct.slice(0, -1)}${ct.slice(-1) === 'A' ? 'B' : 'A'}.${tag}`
  assert.throws(() => openSecret(flipped))
  assert.throws(() => openSecret('not-a-bundle'))
  assert.throws(() => openSecret('a.b'))
})

test('fingerprint exposes only the last 4 characters', () => {
  assert.equal(fingerprintSecret('sk-abc123xyz'), '…3xyz')
  assert.ok(!fingerprintSecret('sk-abc123xyz').includes('sk-abc'))
})
