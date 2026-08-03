const clean = (value = '') => value
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;|&#34;/g, '"')
  .replace(/&#39;|&apos;/g, '’')
  .replace(/&hellip;/g, '…')
  .replace(/\s+/g, ' ')
  .trim()

export function articleSummaryFromHtml(html) {
  const raw = html.match(/<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]+content=["']([^"']+)/i)?.[1]
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:description|description)["']/i)?.[1]
    ?? html.match(/<article[\s\S]*?<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/i)?.[1]
  return clean(raw).slice(0, 360) || undefined
}
