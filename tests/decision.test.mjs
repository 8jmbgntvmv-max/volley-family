import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { groupByWeekend } from '../src/lib/decision.mjs'
import { extractMateseResults } from '../src/lib/fipav-results.mjs'
import { articleImageFromHtml } from '../src/lib/news-image.mjs'
test('raggruppa le gare della stessa settimana', () => { const groups = groupByWeekend([{ date: '2026-10-24' }, { date: '2026-10-25' }, { date: '2026-11-01' }]); assert.equal(groups.length, 2); assert.equal(groups[0].matches.length, 2) })
test('include le 26 gare Matese del girone H', async () => { const source = await readFile(new URL('../src/data/schedule.ts', import.meta.url), 'utf8'); assert.equal((source.match(/\['11\d{3}','202[67]-/g) ?? []).length, 26); assert.match(source, /name: 'FAAM Matese'/); assert.match(source, /status: 'published'/) })
test('mostra sempre una anteprima news anche senza immagine', async () => { const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'); assert.match(source, /className="news-preview"/); assert.match(source, /onError=/) })
test('recupera l’immagine principale dagli articoli Altino', () => {
  const html = '<img width="1054" src="https://www.altinovolley.it/wp-content/uploads/2026/08/cami.png" class="post-top-featured wp-post-image" alt="">'
  assert.equal(articleImageFromHtml(html), 'https://www.altinovolley.it/wp-content/uploads/2026/08/cami.png')
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
