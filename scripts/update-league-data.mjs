import { readFile, writeFile } from 'node:fs/promises'
import { parseLfvPlayerStats } from '../src/lib/league-stats.mjs'

const outputUrl = new URL('../public/league-data.json', import.meta.url)
const fallback = JSON.parse(await readFile(outputUrl, 'utf8'))
const clean = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
const cells = (html) => [...html.matchAll(/<td(?:\s[^>]*)?>([\s\S]*?)<\/td>/gi)].map((match) => clean(match[1]))
const number = (value) => value === '' || value === '-' ? null : Number(String(value).replace(',', '.'))

async function get(url) {
  const requestUrl = new URL(url)
  requestUrl.searchParams.set('_vf', Date.now().toString())
  const response = await fetch(requestUrl, { cache: 'no-store', headers: { 'user-agent': 'VolleyFamily/1.0 (+https://github.com/8jmbgntvmv-max/volley-family)' } })
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return response.text()
}

const altinoLinks = fallback.teams.altino.links
const perugiaLinks = fallback.teams.perugia.links

async function altinoData() {
  const [statsHtml, standingsHtml] = await Promise.all([get(altinoLinks.statistics), get(altinoLinks.standings)])
  if (!/Stagione\s*2026\/27/i.test(clean(statsHtml))) throw new Error('Statistiche Altino: stagione 2026/27 non riconosciuta')
  const generalTable = statsHtml.match(/Match giocati[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i)?.[1] ?? ''
  const values = cells(generalTable).map(number)
  const stats = values[0] === null ? null : {
    played: values[0], wins: values[1], losses: values[2], setsPlayed: values[3], setsWon: values[4], setsLost: values[5],
  }
  const standingRow = [...standingsHtml.matchAll(/<tr(?:\s[^>]*)?>([\s\S]*?)<\/tr>/gi)].find((match) => /Tenaglia Altino Avastese Volley/i.test(match[1]) && /cella-(?:posizione|punti|vinte|perse)/i.test(match[1]))?.[1]
  const standingValues = standingRow ? cells(standingRow) : []
  const standing = stats?.played && standingValues.length ? { raw: standingValues } : null
  const players = parseLfvPlayerStats(statsHtml)
  return { ...fallback.teams.altino, standing, stats, players }
}

async function perugiaData() {
  const [statsHtml, standingsHtml] = await Promise.all([get(perugiaLinks.statistics), get(perugiaLinks.standings)])
  if (!/Stagione\s*2026\/2027/i.test(clean(statsHtml))) throw new Error('Statistiche Perugia: stagione 2026/27 non riconosciuta')
  const row = [...standingsHtml.matchAll(/<tr(?:\s[^>]*)?>([\s\S]*?)<\/tr>/gi)].find((match) => /Sir Susa Scai Perugia/i.test(match[1]) && /Statistiche Squadra/i.test(match[1]))?.[1]
  const values = row ? cells(row) : []
  const numeric = values.slice(2).map(number)
  const played = numeric[1] ?? 0
  const standing = played ? { position: number(values[0].match(/^\d+/)?.[0]), points: numeric[0], played, wins: numeric[2], losses: numeric[3], setsWon: numeric[10], setsLost: numeric[11] } : null
  const stats = /Nessun dato disponibile per la selezione effettuata/i.test(statsHtml) ? null : { officialPageAvailable: true }
  return { ...fallback.teams.perugia, standing, stats, players: fallback.teams.perugia.players ?? [] }
}

const [altino, perugia] = await Promise.allSettled([altinoData(), perugiaData()])
const teams = {
  altino: altino.status === 'fulfilled' ? altino.value : fallback.teams.altino,
  perugia: perugia.status === 'fulfilled' ? perugia.value : fallback.teams.perugia,
  matese: fallback.teams.matese,
}

await writeFile(outputUrl, `${JSON.stringify({ updatedAt: new Date().toISOString(), teams }, null, 2)}\n`)
console.log(`Dati Lega aggiornati: Altino ${teams.altino.stats?.played ?? 0} gare, Perugia ${teams.perugia.standing?.played ?? 0} gare`)
