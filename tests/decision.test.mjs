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
import { buildUpdateItems, todaysUpdateItems, unreadUpdateItems, updateDateKey } from '../src/lib/update-center.mjs'
import { isFamilyBoardConfigured, validateFamilyBoardPost } from '../src/lib/family-board.mjs'
import { athleteMediaLinks } from '../src/lib/athlete-media.mjs'
import { youtubeLiveUrl } from '../src/lib/live-streams.mjs'
import { lineupNewsForMatch, nextMatchesByTeam, relatedNewsForMatch } from '../src/lib/weekend-volley.mjs'
import { newsSourceCatalog, searchableSourceGroups } from '../src/lib/news-source-catalog.mjs'
import { instagramOembedItem, instagramPublishedAt, instagramVolleyItems } from '../src/lib/instagram-news.mjs'
import { encodeRosterSubmission, mergeRosterAnnouncements, parseRosterSubmission } from '../src/lib/roster-submission.mjs'
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
test('Weekend Volley seleziona le prossime tre gare e solo informazioni pubblicate', () => {
  const schedule = [
    { id: 'a-old', team: 'altino', date: '2026-08-01', opponent: 'Vecchia' },
    { id: 'a-next', team: 'altino', date: '2026-10-04', opponent: 'Monviso Volley' },
    { id: 'm-next', team: 'matese', date: '2026-10-17', opponent: 'Poolstars' },
    { id: 'p-next', team: 'perugia', date: '2026-10-18', opponent: 'Cuneo Volley' },
  ]
  assert.deepEqual(nextMatchesByTeam(schedule, ['altino', 'matese', 'perugia'], '2026-08-05').map((match) => match.id), ['a-next', 'm-next', 'p-next'])
  const news = [
    { id: 'specifica', team: 'altino', title: 'Verso Monviso Volley, il coach presenta la gara', summary: 'Possibile sestetto in campo con la rosa al completo', publishedAt: '2026-09-30T10:00:00Z' },
    { id: 'generica', team: 'altino', title: 'Nuova maglia', publishedAt: '2026-09-29T10:00:00Z' },
  ]
  assert.deepEqual(relatedNewsForMatch(schedule[1], news).map((item) => item.id), ['specifica'])
  assert.deepEqual(lineupNewsForMatch(schedule[1], news).map((item) => item.id), ['specifica'])
})
test('News avvia una scansione reale e mostra l’esito delle fonti', async () => {
  const [app, updater, workflow, board, sql] = await Promise.all([
    readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/update-news.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/family-board.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../supabase/news-refresh.sql', import.meta.url), 'utf8'),
  ])
  for (const label of ['CERCA ORA', 'Ultimo controllo:', 'Vedi fonti controllate', 'AGGIUNGI POST FACEBOOK / INSTAGRAM', 'Weekend Volley', 'Possibile formazione']) assert.match(app, new RegExp(label))
  assert.match(app, /requestNewsRefresh/)
  assert.match(board, /vf_request_news_refresh/)
  assert.match(sql, /net\.http_post/)
  assert.match(sql, /actions\/workflows\/deploy\.yml\/dispatches/)
  assert.match(updater, /sources/)
  assert.match(updater, /Media: Matese Volley/)
  assert.match(updater, /vf_list_public_news_links/)
  assert.match(workflow, /workflow_dispatch/)
  assert.match(workflow, /7,22,37,52/)
})
test('News distingue le fonti web dalla segnalazione obbligatoria dei nuovi post social', async () => {
  const [app, updater] = await Promise.all([
    readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/update-news.mjs', import.meta.url), 'utf8'),
  ])
  assert.match(app, /AGGIUNGI POST FACEBOOK \/ INSTAGRAM/)
  assert.match(app, /Non può scoprire da solo nuovi post Facebook o Instagram/)
  assert.match(app, /SALVA NELLE NEWS/)
  assert.match(updater, /Post Instagram Matese già registrati'.*mode: 'direct'/)
})
test('il catalogo media alimenta ricerche mirate per le tre squadre', async () => {
  const updater = await readFile(new URL('../scripts/update-news.mjs', import.meta.url), 'utf8')
  for (const label of ['Volley News', 'Volleyball.it', 'iVolley Magazine', 'Dallari Volley', 'Pianeta Volley', 'VolleyUmbria.it', 'CSI Campania', 'Rete8', 'VASPORT']) {
    assert.ok(newsSourceCatalog.some((source) => source.label.includes(label)), `${label} manca dal catalogo`)
  }
  for (const team of ['altino', 'matese', 'perugia']) assert.ok(searchableSourceGroups(team).flat().length >= 10)
  assert.match(updater, /catalogSearches/)
  assert.match(updater, /perugiaOfficialNews/)
  assert.match(updater, /altinoOfficialNews/)
  assert.match(updater, /mateseInstagramNews/)
})
test('estrae soltanto le pubblicazioni volley dal profilo pubblico Matese', () => {
  const payload = { items: [
    { pk: '1', code: 'VOLLEY1', taken_at: 1785931200, caption: { text: 'Serie B2: nuova schiacciatrice per il roster della pallavolo Matese.' }, image_versions2: { candidates: [{ url: 'https://example.test/atleta.jpg' }] } },
    { pk: '2', code: 'BASKET1', taken_at: 1785931300, caption: { text: 'La prima squadra di basket torna in palestra.' } },
  ] }
  const items = instagramVolleyItems(payload, { team: 'matese', source: 'Instagram ufficiale Matese' })
  assert.equal(items.length, 1)
  assert.equal(items[0].url, 'https://www.instagram.com/p/VOLLEY1/')
  assert.equal(items[0].image, 'https://example.test/atleta.jpg')
})
test('trasforma il post ufficiale Matese in una news con anteprima', () => {
  const item = instagramOembedItem({
    title: '🏐 CAROLA NASI ANCORA CON NOI! La Polisportiva Matese conferma il libero per la Serie B2.',
    media_id: '3956350959856672093_3063055134',
    thumbnail_url: 'https://example.test/carola-nasi.jpg',
  }, {
    team: 'matese', source: 'Instagram ufficiale Matese',
    url: 'https://www.instagram.com/p/DbnyDyBCF1d/', publishedAt: '2026-08-04T14:30:08.859Z',
  })
  assert.equal(item.id, 'matese-instagram-3956350959856672093')
  assert.equal(item.title, 'CAROLA NASI ANCORA CON NOI!')
  assert.equal(item.image, 'https://example.test/carola-nasi.jpg')
  assert.equal(instagramPublishedAt('3956350959856672093_3063055134'), '2026-08-04T14:30:08.859Z')
})
test('include le conferme Facebook di Iole Avecone e Marlene Silva Ascensao', async () => {
  const [updater, roster] = await Promise.all([
    readFile(new URL('../scripts/update-news.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../src/data/rosters.ts', import.meta.url), 'utf8'),
  ])
  assert.match(updater, /facebook\.com\/share\/p\/19aHw3rNoA/)
  assert.match(updater, /facebook\.com\/share\/p\/1MRFonQEqB/)
  assert.match(roster, /Iole Isabella Avecone', role: 'Schiacciatrice'/)
  assert.match(roster, /Marlene Silva Ascensao', role: 'Centrale'/)
})
test('un annuncio social di una nuova atleta aggiorna News e roster', async () => {
  const encoded = encodeRosterSubmission('Anna Verdi', 'Centrale')
  assert.deepEqual(parseRosterSubmission(encoded), { name: 'Anna Verdi', role: 'Centrale' })
  const rosterData = [{ team: 'matese', players: [{ name: 'Chiara Lupoli', followed: true }] }]
  const merged = mergeRosterAnnouncements(rosterData, [{ team: 'matese', rosterPlayer: { name: 'Anna Verdi', role: 'Centrale', profileUrl: 'https://facebook.com/post' } }])
  assert.equal(merged[0].players.length, 2)
  assert.equal(merged[0].players[1].name, 'Anna Verdi')
  const [app, updater] = await Promise.all([
    readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/update-news.mjs', import.meta.url), 'utf8'),
  ])
  assert.match(app, /Nuova atleta \/ roster/)
  assert.match(app, /SALVA IN NEWS E ROSTER/)
  assert.match(updater, /rosterPlayer/)
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
  assert.match(app, /Società e canali ufficiali/)
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
test('Novità non ripete le news già lette', () => {
  const items = [
    { id: 'news:letta', title: 'Già letta' },
    { id: 'news:nuova', title: 'Nuova' },
  ]
  assert.deepEqual(unreadUpdateItems(items, new Set(['news:letta'])), [items[1]])
})
test('Novità da leggere mostra soltanto gli aggiornamenti del giorno', () => {
  const items = [
    { id: 'oggi', publishedAt: '2026-08-07T08:00:00Z' },
    { id: 'ieri', publishedAt: '2026-08-06T22:00:00Z' },
  ]
  assert.deepEqual(todaysUpdateItems(items, '2026-08-07'), [items[0]])
  assert.equal(updateDateKey(new Date('2026-08-07T22:30:00Z')), '2026-08-08')
})
test('il pulsante Novità è riconoscibile dal testo', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(app, /className="updates-button"[\s\S]*?<span>Novità<\/span>/)
  assert.doesNotMatch(app, /<span>♢<\/span>/)
})
test('la bacheca valida i messaggi e richiede un archivio configurato', () => {
  assert.equal(isFamilyBoardConfigured({ url: 'https://example.supabase.co', anonKey: 'public-key' }), true)
  assert.equal(isFamilyBoardConfigured({ url: '', anonKey: '' }), false)
  assert.deepEqual(validateFamilyBoardPost('  Ci sarò sabato  '), { valid: true, content: 'Ci sarò sabato' })
  assert.equal(validateFamilyBoardPost('   ').valid, false)
  assert.equal(validateFamilyBoardPost('x'.repeat(501)).valid, false)
})
test('ogni atleta dispone di ricerche stampa, social, video e società', () => {
  const links = athleteMediaLinks('Luca Loreti', 'https://www.sirsafetyperugia.it/')
  assert.deepEqual(links.map((link) => link.id), ['news', 'web', 'instagram', 'facebook', 'youtube', 'club'])
  for (const link of links) assert.match(link.url, /^https:\/\//)
  assert.match(links.find((link) => link.id === 'instagram').url, /instagram/)
  assert.match(links.find((link) => link.id === 'club').url, /sirsafetyperugia/)
})
test('la scheda atleta collega media pubblici e canali della società', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  for (const label of ['Media dell’atleta', 'Stampa e articoli', 'Società e canali ufficiali']) assert.match(app, new RegExp(label))
})
test('predispone le dirette sui canali YouTube ufficiali', async () => {
  assert.equal(youtubeLiveUrl('https://www.youtube.com/@asdaltinovolley'), 'https://www.youtube.com/@asdaltinovolley/live')
  assert.equal(youtubeLiveUrl(), null)
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  for (const label of ['Dirette delle partite', 'Apri diretta', 'Canale in attesa']) assert.match(app, new RegExp(label))
})
test('predispone accesso tramite invito, avvisi interni e bacheca familiare condivisa', async () => {
  const [app, schema] = await Promise.all([
    readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../supabase/family-board.sql', import.meta.url), 'utf8'),
  ])
  for (const value of ['Accesso familiare', 'Codice famiglia', 'Bacheca familiare', 'Pubblica per tutti', 'Segna tutto come letto', 'vf-seen-updates-v1']) assert.match(app, new RegExp(value))
  assert.match(app, /familyInviteHash = '[a-f0-9]{64}'/)
  assert.match(schema, /author_id = auth\.uid\(\)/)
  assert.match(schema, /enable row level security/)
})
