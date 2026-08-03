export function articleImageFromHtml(html) {
  const openGraph = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)?.[1]
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
  if (openGraph) return openGraph

  const featuredTag = html.match(/<img\b[^>]*class=["'][^"']*(?:post-top-featured|wp-post-image)[^"']*["'][^>]*>/i)?.[0]
  return featuredTag?.match(/\bsrc=["']([^"']+)/i)?.[1]
}
