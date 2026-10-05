import { readFile, writeFile } from 'node:fs/promises'
import { extractMateseResults } from '../src/lib/fipav-results.mjs'
import { legaAGiornataUrls, parseLegaAResults, parseLfvResults } from '../src/lib/league-results.mjs'

const FIPAV_URL = 'https://pub-8394085fb0ca451eaa42bc05b01c416f.r2.dev/public/json/2026/B2/F/H/calendario.json'
const ALTINO_URL = 'https://www.legavolleyfemminile.it/club/tenaglia-altino-avastese-volley/710969/risultati/'
const PERUGIA_URL = 'https://www.legavolley.it/risultati/?Anno=2026&IdCampionato=999'
const LIVE_RESULTS_URL = 'https://8jmbgntvmv-max.github.io/volley-family/results.json'
const outputUrl = new URL('../public/results.json', import.meta.url)

async function get(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'VolleyFamily/1.0 (+https://github.com/8jmbgntvmv-max/volley-family)' } })
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return response
}

async function getJson(url) { return (await get(url)).json() }
async function getText(url) { return (await get(url)).text() }

const localFallback = JSON.parse(await readFile(outputUrl, 'utf8'))
let fallback = localFallback
try {
  const published = await getJson(LIVE_RESULTS_URL)
  if (Array.isArray(published.items) && published.items.length >= (localFallback.items?.length ?? 0)) fallback = published
} catch {
  // La prima pubblicazione o un problema di rete non devono cancellare il fallback locale.
}

const checkedAt = new Date().toISOString()
const sourceTasks = [
  (async () => ({ team: 'matese', items: extractMateseResults(await getJson(FIPAV_URL)).map((item) => ({ ...item, team: 'matese' })), source: FIPAV_URL }))(),
  (async () => {
    const items = parseLfvResults(await getText(ALTINO_URL), checkedAt)
    if (items.length < 20) throw new Error(`Calendario Altino incompleto: ${items.length} gare`)
    return { team: 'altino', items, source: ALTINO_URL }
  })(),
  (async () => {
    const indexHtml = await getText(PERUGIA_URL)
    const urls = legaAGiornataUrls(indexHtml, PERUGIA_URL)
    const pages = await Promise.all(urls.map((url) => getText(url)))
    const items = pages.flatMap((html) => parseLegaAResults(html, checkedAt))
    if (items.length < 11) throw new Error(`Calendario Perugia incompleto: ${items.length} gare`)
    return { team: 'perugia', items, source: PERUGIA_URL }
  })(),
]
const fetched = await Promise.allSettled(sourceTasks)
const successful = fetched.filter((result) => result.status === 'fulfilled').map((result) => result.value)
const failed = fetched.filter((result) => result.status === 'rejected')
const items = [...new Map([
  ...successful.flatMap((result) => result.items.map((item) => [item.matchNumber, item])),
  ...(failed.length ? (fallback.items ?? []).map((item) => [item.matchNumber, { team: item.team ?? 'matese', ...item }]) : []),
]).values()]
const fingerprint = (values) => JSON.stringify(values.map(({ sourceUpdatedAt: _sourceUpdatedAt, ...item }) => item))
const changed = fingerprint(items) !== fingerprint(fallback.items ?? [])
const data = {
  updatedAt: changed ? checkedAt : fallback.updatedAt,
  source: successful.map((result) => result.source),
  championship: 'Risultati ufficiali · Lega Volley Femminile A2, Lega Pallavolo Serie A e FIPAV nazionale',
  items: changed ? items : fallback.items,
}
await writeFile(outputUrl, `${JSON.stringify(data, null, 2)}\n`)
console.log(`Risultati aggiornati: Altino ${items.filter((item) => item.team === 'altino' && item.played).length}, Matese ${items.filter((item) => (item.team ?? 'matese') === 'matese' && item.played).length}, Perugia ${items.filter((item) => item.team === 'perugia' && item.played).length}`)
if (failed.length) console.warn(`Fonti risultati non disponibili: ${failed.length}; conservati i dati precedenti.`, failed.map((result) => result.reason?.message ?? 'errore'))
