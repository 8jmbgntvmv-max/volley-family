import { readFile, writeFile } from 'node:fs/promises'
import { FIPAV_COMPETITIONS, parseFipavCalendar, publicFixture, resultFromFipavMatch } from '../src/lib/fipav-season.mjs'

const LIVE_RESULTS_URL = 'https://8jmbgntvmv-max.github.io/volley-family/results.json'
const resultsUrl = new URL('../public/results.json', import.meta.url)
const scheduleUrl = new URL('../public/schedule.json', import.meta.url)
const sourceUrl = ({ serie, sesso, girone }) => `https://media.myvolley.net/public/json/2026/${serie}/${sesso}/${girone}/calendario.json`

async function getJson(url) {
  const response = await fetch(url, { cache: 'no-store', headers: { 'user-agent': 'VolleyFamily/1.0 (+https://github.com/8jmbgntvmv-max/volley-family)' } })
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return response.json()
}

const localResults = JSON.parse(await readFile(resultsUrl, 'utf8'))
let fallbackResults = localResults
try {
  const published = await getJson(LIVE_RESULTS_URL)
  if (Array.isArray(published.items) && published.items.length >= (localResults.items?.length ?? 0)) fallbackResults = published
} catch {
  // Un errore remoto non deve cancellare l'ultimo risultato noto.
}
let fallbackSchedule = null
try { fallbackSchedule = JSON.parse(await readFile(scheduleUrl, 'utf8')) } catch { /* Prima generazione del calendario dinamico. */ }

const checkedAt = new Date().toISOString()
const fetches = await Promise.allSettled(Object.entries(FIPAV_COMPETITIONS).map(async ([team, config]) => {
  const url = sourceUrl(config)
  const calendar = parseFipavCalendar(await getJson(url), team, config)
  return { team, url: config.url, items: calendar, matches: calendar.map(resultFromFipavMatch) }
}))
const successful = fetches.filter((result) => result.status === 'fulfilled').map((result) => result.value)
const failed = fetches.filter((result) => result.status === 'rejected')
const failedTeams = new Set(failed.map((result) => Object.keys(FIPAV_COMPETITIONS)[fetches.findIndex((entry) => entry === result)]))

const keepFallbackTeams = (items = []) => items.filter((item) => failedTeams.has(item.team ?? 'matese')).map((item) => ({ ...item, team: item.team ?? 'matese' }))
const resultItems = [
  ...successful.flatMap((result) => result.matches),
  ...keepFallbackTeams(fallbackResults.items),
]
const scheduleItems = successful.flatMap((result) => result.items.map(publicFixture))
const priorScheduleItems = fallbackSchedule?.items ?? []
const completeSchedule = successful.length === Object.keys(FIPAV_COMPETITIONS).length ? scheduleItems : [
  ...scheduleItems,
  ...priorScheduleItems.filter((item) => failedTeams.has(item.team)),
]

const unique = (items) => [...new Map(items.map((item) => [`${item.team}:${item.matchNumber}`, item])).values()]
const canonicalResults = unique(resultItems)
const fingerprint = (values) => JSON.stringify(values.map(({ sourceUpdatedAt: _sourceUpdatedAt, ...item }) => item))
const resultsChanged = fingerprint(canonicalResults) !== fingerprint(fallbackResults.items ?? [])
const resultsData = {
  updatedAt: resultsChanged ? checkedAt : fallbackResults.updatedAt,
  source: successful.map((result) => result.url),
  championship: 'Federazione Italiana Pallavolo · A2 femminile, B2 femminile girone H, A1 maschile',
  items: resultsChanged ? canonicalResults : fallbackResults.items,
}
await writeFile(resultsUrl, `${JSON.stringify(resultsData, null, 2)}\n`)

const scheduleChanged = JSON.stringify(completeSchedule) !== JSON.stringify(priorScheduleItems)
if (completeSchedule.length && scheduleChanged) {
  await writeFile(scheduleUrl, `${JSON.stringify({ updatedAt: checkedAt, source: successful.map((result) => result.url), items: completeSchedule }, null, 2)}\n`)
}

console.log(`Dati FIPAV acquisiti: ${successful.map((item) => `${item.team} ${item.items.length} gare`).join(', ') || 'nessuna fonte raggiunta'}`)
if (failed.length) console.warn('Fonti FIPAV non disponibili; conservati i dati precedenti per le competizioni non raggiunte.', failed.map((result) => result.reason?.message ?? 'errore'))
