import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { groupByWeekend } from '../src/lib/decision.mjs'
import { extractMateseResults } from '../src/lib/fipav-results.mjs'
import { articleImageFromHtml } from '../src/lib/news-image.mjs'
import { mergeNewsItems } from '../src/lib/news-items.mjs'
import { googleMapsDirectionsUrl } from '../src/lib/maps.mjs'
import { classifyMatchFocus } from '../src/lib/news-focus.mjs'
import { articleSummaryFromHtml } from '../src/lib/news-summary.mjs'
import { parseLfvPlayerStats } from '../src/lib/league-stats.mjs'
import { buildUpdateItems } from '../src/lib/update-center.mjs'
test('raggruppa le gare della stessa settimana', () => { const groups = groupByWeekend([{ date: '2026-10-24' }, { date: '2026-10-25' }, { date: '2026-11-01' }]); assert.equal(groups.length, 2); assert.equal(groups[0].matches.length, 2) })
test('include le 26 gare Matese del girone H', async () => { const source = await readFile(new URL('../src/data/schedule.ts', import.meta.url), 'utf8'); assert.equal((source.match(/\['11\d{3}','202[67]-/g) ?? []).length, 26); assert.match(source, /name: 'FAAM Matese'/); assert.match(source, /status: 'published'/) })
test('mostra sempre una anteprima news anche senza immagine', async () => { const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'); assert.match(source, /className="news-preview"/); assert.match(source, /onError=/) })
test('recupera l’immagine principale dagli articoli Altino', () => {
  const html = '<img width="1054" src="https://www.altinovolley.it/wp-content/uploads/2026/08/cami.png" class="post-top-featured wp-post-image" alt="">'
  assert.equal(articleImageFromHtml(html), 'https://www.altinovolley.it/wp-content/uploads/2026/08/cami.png')
})
test('un aggiornamento incompleto non cancella news o immagini già pubblicate', () => {
  const fresh = [{ id: 'new', team: 'altino', title: 'News di oggi', url: 'https://example.test/oggi', source: 'Sito ufficiale', publishedAt: '2026-08-03T08:40:55.000Z' }]
  const previous = [
    { ...fresh[0], image: 'https://example.test/oggi.png' },
    { id: 'old', team: 'altino', title: 'News precedente', url: 'https://example.test/prima', source: 'Sito ufficiale', publishedAt: '2026-07-30T09:52:09.000Z' },
  ]
  const merged = mergeNewsItems(fresh, previous)
  assert.equal(merged.length, 2)
  assert.equal(merged[0].image, 'https://example.test/oggi.png')
})
test('non propone una partita consigliata', async () => { const [source, styles] = await Promise.all([readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'), readFile(new URL('../src/App.css', import.meta.url), 'utf8')]); assert.doesNotMatch(`${source}\n${styles}`, /chooseHomeMatch|CONSIGLIATA|partita consigliata/i); assert.match(source, /senza suggerimenti/i) })
test('estrae il risultato ufficiale Matese dal formato FIPAV', () => {
  const mateseMatch = { ng: '11404', played: true, ris_ufficiale: '1', team1: { code: '11556', name: 'A.S.D. POOLSTARS' }, team2: { code: '10387', name: 'FAAM MATESE CE' }, 'team1-setwin': 1, 'team2-setwin': 3, pt_a: [25, 20, 18, 19], pt_b: [22, 25, 25, 25], data_ultimo_aggiornamento: '2026-10-17T20:00:00Z' }
  const placeholder = (index) => ({ ...mateseMatch, ng: String(12000 + index), played: false, ris_ufficiale: '0', 'team1-setwin': 0, 'team2-setwin': 0, pt_a: [], pt_b: [] })
  const items = extractMateseResults({ data: { matches: [mateseMatch, ...Array.from({ length: 25 }, (_, index) => placeholder(index))] } })
  assert.equal(items.length, 26)
  assert.deepEqual(items[0], { matchNumber: '11404', played: true, official: true, firstTeamSets: 1, secondTeamSets: 3, sets: [{ first: 25, second: 22 }, { first: 20, second: 25 }, { first: 18, second: 25 }, { first: 19, second: 25 }], sourceUpdatedAt: '2026-10-17T20:00:00Z' })
})
test('collega risultati e aggiornamento periodico alla pubblicazione', async () => {
  const [app, workflow, packageJson] = await Promise.all([
    readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8'),
    readFile(new URL('../package.json', import.meta.url), 'utf8'),
  ])
  assert.match(app, /results\.json/)
  assert.match(workflow, /npm run results:update/)
  assert.match(packageJson, /"results:update"/)
})
test('apre le indicazioni con un URL universale Google Maps', () => {
  const url = googleMapsDirectionsUrl('Palamatese, Piedimonte Matese')
  assert.equal(url, 'https://www.google.com/maps/dir/?api=1&destination=Palamatese%2C+Piedimonte+Matese&dir_action=navigate')
  assert.equal(googleMapsDirectionsUrl(), null)
})
test('mantiene una sezione dedicata ai tre atleti e la ricerca periodica', async () => {
  const [app, updater] = await Promise.all([
    readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/update-news.mjs', import.meta.url), 'utf8'),
  ])
  for (const name of ['Chiara Lupoli', 'Camilla Lupoli', 'Luca Loreti']) {
    assert.match(app, new RegExp(name))
    assert.match(updater, new RegExp(name))
  }
  assert.match(updater, /news\.google\.com\/rss\/search/)
})
test('distingue pre-partita, post-partita e indisponibilità senza inferenze', () => {
  assert.equal(classifyMatchFocus('Coach presenta la gara in vista del derby'), 'pre')
  assert.equal(classifyMatchFocus('Vittoria in rimonta nel post partita'), 'post')
  assert.equal(classifyMatchFocus('Due assenze per infortunio riportate dal club'), 'availability')
  assert.equal(classifyMatchFocus('Nuova maglia per la stagione'), null)
})
test('estrae una breve sintesi pubblicata dall’articolo', () => {
  const html = '<meta property="og:description" content="Il tecnico presenta la gara e conferma la rosa disponibile.">'
  assert.equal(articleSummaryFromHtml(html), 'Il tecnico presenta la gara e conferma la rosa disponibile.')
})
test('predispone in Home roster, risultati, classifiche e statistiche', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  for (const label of ['Pre e post partita', 'Roster', 'Risultati e classifiche', 'Statistiche']) assert.match(app, new RegExp(label))
  assert.match(app, /Parziali:/)
  assert.match(app, /Andamento campionato/)
})
test('aggiorna periodicamente i dati dalle Leghe ufficiali A1 e A2', async () => {
  const [workflow, packageJson, leagueData] = await Promise.all([
    readFile(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8'),
    readFile(new URL('../package.json', import.meta.url), 'utf8'),
    readFile(new URL('../public/league-data.json', import.meta.url), 'utf8'),
  ])
  assert.match(workflow, /npm run league:update/)
  assert.match(packageJson, /"league:update"/)
  assert.match(leagueData, /legavolleyfemminile\.it/)
  assert.match(leagueData, /legavolley\.it/)
  assert.match(leagueData, /federvolley\.it/)
})
test('completa il roster Altino e rende apribile ogni atleta', async () => {
  const [roster, app] = await Promise.all([
    readFile(new URL('../src/data/rosters.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
  ])
  const altinoBlock = roster.match(/team: 'altino'[\s\S]*?\n  },/)?.[0] ?? ''
  assert.equal((altinoBlock.match(/name: '/g) ?? []).length, 13)
  for (const name of ['Adji Astou Ndoye', 'Gaia Farelli', 'Martina Ferrara', 'Sara Stival', 'Amelie Joyce Pixner', 'Ilaria Maiezza', 'Florencia Ferraro', 'Valentina Omonoyan', 'Gaia Riva', 'Claudia Provaroni', 'Sara Mori', 'Giorgia Bernasconi', 'Camilla Lupoli']) assert.match(altinoBlock, new RegExp(name))
  assert.match(app, /onSelectAthlete/)
  assert.match(app, /Statistiche personali/)
  assert.match(app, /Stampa e articoli/)
  assert.match(app, /Social ufficiali della squadra/)
})
test('estrae le statistiche personali dalla tabella ufficiale della Lega femminile', () => {
  const html = '<h2>Top atlete</h2><table><tbody><tr><td>1</td><td></td><td><a href="/player/player/CAM-LUP-03/">Camilla Lupoli</a></td><td>4</td><td>12</td><td>8</td><td>5</td><td>62,5%</td><td>20</td><td>3</td><td>2</td><td>1</td><td>7</td></tr></tbody></table>'
  assert.deepEqual(parseLfvPlayerStats(html), [{ name: 'Camilla Lupoli', profileUrl: 'https://www.legavolleyfemminile.it/player/player/CAM-LUP-03/', appearances: 4, points: 12, attacks: 8, attackPoints: 5, attackPercentage: 62.5, serves: 20, aces: 3, blocks: 2, serveErrors: 1, perfectReceptions: 7 }])
})
test('crea il centro Novità da news, pre-partita, atleti e risultati', () => {
  const news = [
    { id: 'n1', team: 'altino', title: 'Nuova maglia', url: 'https://example.test/1', source: 'Club', publishedAt: '2026-08-04T10:00:00Z' },
    { id: 'n2', team: 'matese', title: 'Il coach presenta la gara', url: 'https://example.test/2', source: 'Club', publishedAt: '2026-08-04T11:00:00Z', matchFocus: 'pre' },
    { id: 'n3', team: 'perugia', title: 'Intervista a Luca Loreti', url: 'https://example.test/3', source: 'Club', publishedAt: '2026-08-04T12:00:00Z', athleteIds: ['luca-loreti'] },
  ]
  const results = { '11404': { matchNumber: '11404', played: true, firstTeamSets: 1, secondTeamSets: 3, sets: [{ first: 20, second: 25 }] } }
  const schedule = [{ matchNumber: '11404', team: 'matese', opponent: 'Poolstars', home: false, date: '2026-10-17' }]
  const items = buildUpdateItems(news, results, schedule)
  assert.deepEqual(new Set(items.map((item) => item.kind)), new Set(['news', 'matches', 'athletes', 'results']))
})
test('predispone accesso tramite invito, avvisi interni e chat WhatsApp locale', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  for (const value of ['Accesso familiare', 'Codice famiglia', 'Chat famiglia', 'Segna tutto come letto', 'vf-seen-updates-v1', 'vf-whatsapp-group-v1']) assert.match(app, new RegExp(value))
  assert.match(app, /familyInviteHash = '[a-f0-9]{64}'/)
})
