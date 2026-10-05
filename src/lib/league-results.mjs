const htmlText = (value = '') => value
  .replace(/<img\b[^>]*>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&#8217;|&#039;|&apos;/gi, "'")
  .replace(/&#8211;|&ndash;/gi, '–')
  .replace(/\s+/g, ' ')
  .trim()

const normalize = (value = '') => htmlText(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it').replace(/[^a-z0-9]+/g, ' ').trim()
const isoDate = (value = '') => {
  const match = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : null
}
const numbers = (value = '') => [...value.matchAll(/\b\d+\b/g)].map((match) => Number(match[0]))

function rowsFromLfvTable(table) {
  return [...table.matchAll(/<tr[^>]*>[\s\S]*?<th[^>]*class="num"[^>]*>\s*(\d+)\s*<\/th>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/tr>/gi)]
    .map((match) => ({ sets: Number(match[1]), name: htmlText(match[2]) }))
}

/** Parse the official LVF club results page for one team. */
export function parseLfvResults(html, checkedAt = new Date().toISOString()) {
  const items = []
  const tables = html.match(/<table\s+class="table\s+risultati"[\s\S]*?<\/table>/gi) ?? []
  for (const table of tables) {
    const header = table.match(/<th[^>]*>\s*#(\d+)\s*<\/th>[\s\S]*?<th[^>]*>\s*(\d{2}\/\d{2}\/\d{4})\s*<\/th>/i)
    if (!header) continue
    const rows = rowsFromLfvTable(table)
    const altinoIndex = rows.findIndex((row) => /ALTINO/i.test(row.name))
    if (altinoIndex < 0 || rows.length < 2) continue
    const first = rows[0]
    const second = rows[1]
    const date = isoDate(header[2])
    if (!date) continue
    items.push({
      matchNumber: header[1], team: 'altino', date, opponent: altinoIndex === 0 ? second.name : first.name,
      home: altinoIndex === 0, played: first.sets + second.sets > 0, official: first.sets + second.sets > 0,
      firstTeamSets: first.sets, secondTeamSets: second.sets, sets: [], sourceUpdatedAt: checkedAt,
    })
  }
  return items
}

const selectedDate = (html) => {
  const giornata = html.match(/<select[^>]*id="Giornata"[\s\S]*?<\/select>/i)?.[0] ?? ''
  return isoDate(giornata.match(/<option[^>]*selected[^>]*>[^<]*\((\d{1,2}\/\d{1,2}\/\d{4})\)/i)?.[1] ?? '')
}

function rowsFromLegaATable(table) {
  return [...table.matchAll(/<tr\s+class="(?:EvenRow|OddRow)"[^>]*>[\s\S]*?<td[^>]*class="risultati-nomesq[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi)].map((match) => {
    const row = match[0]
    const scoreMatch = row.match(/<td[^>]*align="center"[^>]*>\s*(\d+)\s*-\s*(\d+)\s*<\/td>/i)
    const cells = [...row.matchAll(/<td(?:\s[^>]*)?>([\s\S]*?)<\/td>/gi)].map((cell) => htmlText(cell[1]))
    const setValues = cells.slice(scoreMatch ? 1 : 0).flatMap((cell) => numbers(cell)).filter((value) => value >= 10)
    return { name: htmlText(match[1]), score: scoreMatch ? [Number(scoreMatch[1]), Number(scoreMatch[2])] : null, setValues }
  })
}

/** Parse one official Lega Pallavolo Serie A results page (one matchday). */
export function parseLegaAResults(html, checkedAt = new Date().toISOString()) {
  const date = selectedDate(html)
  if (!date) return []
  const table = html.match(/<table[^>]*id="GareGiornata"[\s\S]*?<\/table>/i)?.[0]
  if (!table) return []
  const rows = rowsFromLegaATable(table)
  const items = []
  for (let index = 0; index + 1 < rows.length; index += 2) {
    const first = rows[index]
    const second = rows[index + 1]
    const perugiaIndex = [first, second].findIndex((row) => /Perugia/i.test(row.name))
    if (perugiaIndex < 0) continue
    const score = first.score ?? second.score
    const played = Boolean(score && (score[0] + score[1] > 0))
    const firstSets = score?.[0] ?? 0
    const secondSets = score?.[1] ?? 0
    const matchNumber = `perugia:${date}:${normalize(perugiaIndex === 0 ? second.name : first.name)}`
    items.push({
      matchNumber, team: 'perugia', date, opponent: perugiaIndex === 0 ? second.name : first.name,
      home: perugiaIndex === 0, played, official: played, firstTeamSets: firstSets, secondTeamSets: secondSets,
      sets: [], sourceUpdatedAt: checkedAt,
    })
  }
  return items
}

export function legaAGiornataUrls(html, baseUrl) {
  const ids = [...html.matchAll(/<option[^>]*value=(?:"|')?(\d+)(?:"|')?[^>]*>[^<]*Giornata/gi)].map((match) => match[1])
  return [...new Set(ids)].map((id) => `${baseUrl}&IdFase=1&IdGiornata=${id}`)
}
