import { readFile, writeFile } from 'node:fs/promises'
import { extractMateseResults } from '../src/lib/fipav-results.mjs'

const FIPAV_URL = 'https://pub-8394085fb0ca451eaa42bc05b01c416f.r2.dev/public/json/2026/B2/F/H/calendario.json'
const LIVE_RESULTS_URL = 'https://8jmbgntvmv-max.github.io/volley-family/results.json'
const outputUrl = new URL('../public/results.json', import.meta.url)

async function getJson(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'VolleyFamily/1.0 (+https://github.com/8jmbgntvmv-max/volley-family)' } })
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return response.json()
}

const localFallback = JSON.parse(await readFile(outputUrl, 'utf8'))
let fallback = localFallback
try {
  const published = await getJson(LIVE_RESULTS_URL)
  if (Array.isArray(published.items) && published.items.length >= (localFallback.items?.length ?? 0)) fallback = published
} catch {
  // La prima pubblicazione o un problema di rete non devono cancellare il fallback locale.
}

try {
  const payload = await getJson(FIPAV_URL)
  const items = extractMateseResults(payload)
  const data = { updatedAt: new Date().toISOString(), source: FIPAV_URL, championship: 'Serie B2 Femminile · Girone H', items }
  await writeFile(outputUrl, `${JSON.stringify(data, null, 2)}\n`)
  console.log(`Risultati FIPAV aggiornati: ${items.filter((item) => item.played).length}/${items.length} gare disputate`)
} catch (error) {
  await writeFile(outputUrl, `${JSON.stringify(fallback, null, 2)}\n`)
  console.warn(`FIPAV non disponibile, conservato l'ultimo aggiornamento valido: ${error.message}`)
}
