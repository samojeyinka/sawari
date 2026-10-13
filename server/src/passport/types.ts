export interface OAuthProfile {
  /** Same as providerId — satisfies passport's Express.User shape. */
  id: string
  provider: 'github' | 'google'
  providerId: string
  email: string | null
  /** Whether the provider asserts the email is verified. Auto-linking an
      existing local account by bare email is only safe when this is true. */
  emailVerified: boolean
  name: string
  avatar: string | null
}

/** Best-effort split of "First Last" into first/last names. */
export function splitName(name: string): { firstName: string; lastName?: string } {
  const [first, ...rest] = name.trim().split(/\s+/)
  const firstName = first || 'Learner'
  const lastName = rest.length ? rest.join(' ') : undefined
  return { firstName, lastName }
}