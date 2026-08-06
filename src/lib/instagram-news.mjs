const volleyTerms = /volley|pallavol|serie\s*b2|roster|schiacciatric|centrale|palleggiatric|oppost[oa]|liber[oa]|giocatric|atleta/i

export function instagramPublishedAt(mediaId) {
  const raw = String(mediaId ?? '').split('_')[0]
  if (!/^\d+$/.test(raw)) return undefined
  const milliseconds = (BigInt(raw) >> 23n) + 1314220021721n
  const date = new Date(Number(milliseconds))
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString()
}

export function instagramVolleyItems(json, { team, source }) {
  const payload = typeof json === 'string' ? JSON.parse(json) : json
  return (payload.items ?? []).flatMap((post) => {
    const caption = post.caption?.text?.replace(/\s+/g, ' ').trim() ?? ''
    if (!caption || !volleyTerms.test(caption) || !post.code || !post.taken_at) return []
    const title = caption.split(/(?<=[.!?])\s/)[0].slice(0, 180)
    const image = post.image_versions2?.candidates?.[0]?.url
    return [{
      id: `${team}-instagram-${post.pk ?? post.code}`,
      team,
      title: title || 'Nuova pubblicazione della società',
      url: `https://www.instagram.com/p/${post.code}/`,
      source,
      publishedAt: new Date(post.taken_at * 1000).toISOString(),
      image,
      summary: caption.slice(0, 500),
    }]
  })
}

export function instagramOembedItem(json, { team, source, url, publishedAt }) {
  const payload = typeof json === 'string' ? JSON.parse(json) : json
  const caption = String(payload.title ?? '').replace(/\s+/g, ' ').trim()
  if (!caption || !volleyTerms.test(caption) || !payload.media_id) return null
  const title = caption.split(/(?<=[.!?])\s/)[0].replace(/^🏐\s*/, '').slice(0, 180)
  return {
    id: `${team}-instagram-${String(payload.media_id).split('_')[0]}`,
    team,
    title: title || 'Nuova pubblicazione della società',
    url,
    source,
    publishedAt: publishedAt ?? instagramPublishedAt(payload.media_id) ?? new Date().toISOString(),
    image: payload.thumbnail_url,
    summary: caption.slice(0, 500),
  }
}
