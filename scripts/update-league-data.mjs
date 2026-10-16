import { readFile, writeFile } from 'node:fs/promises'
import { FIPAV_COMPETITIONS, parseFipavStandings, parseFipavStandingsTable } from '../src/lib/fipav-season.mjs'

const outputUrl = new URL('../public/league-data.json', import.meta.url)
const fallback = JSON.parse(await readFile(outputUrl, 'utf8'))
const baseUrl = ({ serie, sesso, girone }) => `https://media.myvolley.net/public/json/2026/${serie}/${sesso}/${girone}/classifica.json`

async function getJson(url) {
  const response = await fetch(url, { cache: 'no-store', headers: { 'user-agent': 'VolleyFamily/1.0 (+https://github.com/8jmbgntvmv-max/volley-family)' } })
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return response.json()
}

const entries = await Promise.allSettled(Object.entries(FIPAV_COMPETITIONS).map(async ([teamId, config]) => {
  const payload = await getJson(baseUrl(config))
  const standing = parseFipavStandings(payload, teamId, config)
  const table = parseFipavStandingsTable(payload, teamId, config)
  const old = fallback.teams?.[teamId] ?? {}
  return [teamId, {
    ...old,
    source: 'Federazione Italiana Pallavolo',
    season: '2026/27',
    competition: config.label,
    links: { ...old.links, results: config.url, standings: config.url, statistics: config.statisticsUrl ?? config.url },
    standing,
    stats: { played: standing.played, wins: standing.wins, losses: standing.losses, setsWon: standing.setsWon, setsLost: standing.setsLost },
    players: old.players ?? [],
  }, table]
}))

const teams = { ...fallback.teams }
const standings = { ...(fallback.standings ?? {}) }
for (const entry of entries) {
  if (entry.status === 'fulfilled') {
    teams[entry.value[0]] = entry.value[1]
    standings[entry.value[0]] = entry.value[2]
  }
  else console.warn(`Classifica non aggiornata: ${entry.reason?.message ?? 'errore'}`)
}

await writeFile(outputUrl, `${JSON.stringify({ updatedAt: new Date().toISOString(), teams, standings }, null, 2)}\n`)
console.log(`Classifiche FIPAV aggiornate: ${Object.entries(teams).map(([id, team]) => `${id} ${team.standing?.position ?? '—'}ª (${team.standing?.points ?? 0} pt)`).join(', ')}`)
