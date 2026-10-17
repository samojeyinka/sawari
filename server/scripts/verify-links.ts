/* ------------------------------------------------------------------ */
/*  Link Verification Engine                                          */
/*  Checks live status of video and article URLs, collects titles,   */
/*  platforms, and statuses, and generates verification markdown.     */
/* ------------------------------------------------------------------ */

export interface LinkCheckResult {
  course: string
  title: string
  url: string
  kind: 'video' | 'article' | 'template' | 'book'
  platform: string
  status: '200 OK' | 'Error' | 'Dropped'
  notes?: string
}

export async function verifyUrl(
  url: string,
  kind: 'video' | 'article' | 'template' | 'book',
): Promise<{ ok: boolean; platform: string; observedStatus: string; title?: string }> {
  const cleanUrl = url.trim()

  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    if (cleanUrl.includes('playlist?list=')) {
      try {
        const res = await fetch(cleanUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        })
        if (res.ok) {
          return { ok: true, platform: 'YouTube Playlist', observedStatus: `${res.status} OK` }
        }
        return { ok: false, platform: 'YouTube Playlist', observedStatus: `${res.status} Fail` }
      } catch (err: any) {
        return { ok: false, platform: 'YouTube Playlist', observedStatus: `Error: ${err.message}` }
      }
    }

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`
      const res = await fetch(oembedUrl)
      if (res.ok) {
        const data = (await res.json()) as { title?: string; author_name?: string }
        const author = data.author_name ? `YouTube (${data.author_name})` : 'YouTube'
        return {
          ok: true,
          platform: author,
          observedStatus: '200 OK',
          title: data.title,
        }
      }
      return { ok: false, platform: 'YouTube', observedStatus: `${res.status} Not Available` }
    } catch (err: any) {
      return { ok: false, platform: 'YouTube', observedStatus: `Error: ${err.message}` }
    }
  }

  // Non-YouTube resources (articles, docs, TED)
  try {
    const res = await fetch(cleanUrl, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })
    const urlObj = new URL(cleanUrl)
    const host = urlObj.hostname.replace(/^www\./, '')
    if (res.ok || res.status === 206) {
      return { ok: true, platform: host, observedStatus: `${res.status} OK` }
    }
    return { ok: false, platform: host, observedStatus: `${res.status} HTTP Error` }
  } catch (err: any) {
    const host = cleanUrl.split('/')[2] ?? 'Web'
    return { ok: false, platform: host, observedStatus: `Network Error: ${err.message}` }
  }
}
