const clean = (value = '') => value
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#39;|&apos;/g, '’')
  .replace(/\s+/g, ' ')
  .trim()

const numeric = (value = '') => {
  const normalized = value.replace('%', '').replace(',', '.').trim()
  return normalized === '' || normalized === '-' ? null : Number(normalized)
}

export function parseLfvPlayerStats(html, baseUrl = 'https://www.legavolleyfemminile.it/') {
  const topAthletes = html.match(/Top atlete[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i)?.[1] ?? ''
  return [...topAthletes.matchAll(/<tr(?:\s[^>]*)?>([\s\S]*?)<\/tr>/gi)].flatMap((row) => {
    const rawCells = [...row[1].matchAll(/<td(?:\s[^>]*)?>([\s\S]*?)<\/td>/gi)].map((match) => match[1])
    const href = rawCells[2]?.match(/href=["']([^"']+)["']/i)?.[1]
    const name = clean(rawCells[2])
    if (!href || !name || rawCells.length < 13) return []
    return [{
      name,
      profileUrl: new URL(href, baseUrl).href,
      appearances: numeric(clean(rawCells[3])),
      points: numeric(clean(rawCells[4])),
      attacks: numeric(clean(rawCells[5])),
      attackPoints: numeric(clean(rawCells[6])),
      attackPercentage: numeric(clean(rawCells[7])),
      serves: numeric(clean(rawCells[8])),
      aces: numeric(clean(rawCells[9])),
      blocks: numeric(clean(rawCells[10])),
      serveErrors: numeric(clean(rawCells[11])),
      perfectReceptions: numeric(clean(rawCells[12])),
    }]
  })
}
