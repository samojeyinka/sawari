export interface MediaSource {
  provider: 'youtube' | 'vimeo' | 'link'
  /** Inline player URL, or null when the site cannot be embedded. */
  embedUrl: string | null
  watchUrl: string
  /** Human label for the source, e.g. "YouTube". */
  label: string
}

/** Turn a resource URL into something we can play in place. YouTube and Vimeo
 *  get an inline embed; anything else falls back to an "open on site" card. */
export function parseMediaUrl(raw: string): MediaSource | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, '')

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0]
    if (id) return youtube(id, raw)
  }

  if (host.endsWith('youtube.com')) {
    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v')
      if (id) return youtube(id, raw)
    }
    const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)
    if (match) return youtube(match[1], raw)
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.match(/(\d+)/)?.[1]
    if (id) {
      return {
        provider: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${id}`,
        watchUrl: raw,
        label: 'Vimeo',
      }
    }
  }

  return { provider: 'link', embedUrl: null, watchUrl: raw, label: host }
}

function youtube(id: string, watchUrl: string): MediaSource {
  return {
    provider: 'youtube',
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    watchUrl,
    label: 'YouTube',
  }
}

/** Human-readable host of a URL ("developer.mozilla.org"), for link cards. */
export function domainOf(raw?: string): string | null {
  if (!raw) return null
  try {
    return new URL(raw).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}
