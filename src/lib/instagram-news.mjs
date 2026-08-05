const volleyTerms = /volley|pallavol|serie\s*b2|roster|schiacciatric|centrale|palleggiatric|oppost[oa]|liber[oa]|giocatric|atleta/i

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
