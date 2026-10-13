import { useEffect, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Types a word out, holds it, deletes it, then moves to the next one.
 * Under reduced motion it returns the first word and never animates.
 */
export function useTypewriter(
  words: readonly string[],
  { typeMs = 72, deleteMs = 34, holdMs = 1900 }: { typeMs?: number; deleteMs?: number; holdMs?: number } = {},
) {
  const [reduced] = useState(prefersReducedMotion)
  const [index, setIndex] = useState(0)
  const [length, setLength] = useState(reduced ? words[0].length : 0)
  const [phase, setPhase] = useState<'typing' | 'holding' | 'deleting'>('typing')

  useEffect(() => {
    if (reduced) return
    const word = words[index % words.length]

    if (phase === 'typing') {
      if (length < word.length) {
        const t = setTimeout(() => setLength(length + 1), typeMs)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => setPhase('holding'), holdMs)
      return () => clearTimeout(t)
    }

    if (phase === 'holding') {
      setPhase('deleting')
      return
    }

    if (length > 0) {
      const t = setTimeout(() => setLength(length - 1), deleteMs)
      return () => clearTimeout(t)
    }

    setIndex((i) => (i + 1) % words.length)
    setPhase('typing')
  }, [index, length, phase, reduced, words, typeMs, deleteMs, holdMs])

  if (reduced) return words[0]
  return words[index % words.length].slice(0, length)
}
