import { readFile, writeFile } from 'node:fs/promises'
import { articleImageFromHtml } from '../src/lib/news-image.mjs'
import { mergeNewsItems } from '../src/lib/news-items.mjs'
import { classifyMatchFocus } from '../src/lib/news-focus.mjs'
import { articleSummaryFromHtml } from '../src/lib/news-summary.mjs'

const outputUrl = new URL('../public/news.json', import.meta.url)
const localFallback = JSON.parse(await readFile(outputUrl, 'utf8'))
const LIVE_NEWS_URL = 'https://8jmbgntvmv-max.github.io/volley-family/news.json'
const decode = (value = '') => value
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;|&#34;/g, '"')
  .replace(/&#39;|&apos;/g, '’')
  .replace(/&hellip;/g, '…')
  .replace(/\s+/g, ' ')
  .trim()

async function get(url) {
  const requestUrl = new URL(url)
  requestUrl.searchParams.set('_vf', Date.now().toString())
  const response = await fetch(requestUrl, { cache: 'no-store', headers: { 'cache-control': 'no-cache', pragma: 'no-cache', 'user-agent': 'VolleyFamily/1.0 (+https://github.com/8jmbgntvmv-max/volley-family)' } })
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return response.text()
}

let fallback = localFallback
try {
  const published = JSON.parse(await get(LIVE_NEWS_URL))
  fallback = { updatedAt: published.updatedAt ?? localFallback.updatedAt, items: mergeNewsItems(published.items ?? [], localFallback.items ?? []) }
} catch {
  // Se GitHub Pages non risponde, resta disponibile il contenuto salvato nel repository.
}

function tag(block, name) {
  return block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] ?? ''
}

function rssItems(xml, team, source, filter = () => true) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match, index) => {
    const block = match[1]
    const title = decode(tag(block, 'title'))
    const description = decode(tag(block, 'description'))
    const url = decode(tag(block, 'link'))
    const image = block.match(/<media:content[^>]+url=["']([^"']+)/i)?.[1]
      ?? block.match(/<enclosure[^>]+url=["']([^"']+)/i)?.[1]
      ?? tag(block, 'description').match(/<img[^>]+src=["']([^"']+)/i)?.[1]
    const publishedAt = new Date(decode(tag(block, 'pubDate'))).toISOString()
    return { id: `${team}-${source}-${index}-${publishedAt}`, team, title, url, source, publishedAt, image, summary: description.slice(0, 360) || undefined, search: `${title} ${description}` }
  }).filter((item) => item.title && item.url && filter(item.search)).map(({ search: _search, ...item }) => item)
}

function perugiaItems(html) {
  const sidebar = html.match(/<aside class="latest-news-widget[\s\S]*?<\/aside>/i)?.[0] ?? ''
  return [...sidebar.matchAll(/<a href="([^"]+)" class="media">([\s\S]*?)<\/a>/gi)].slice(0, 5).map((match, index) => {
    const block = match[2]
    const date = decode(block.match(/class="[^"]*datanewsbar[^"]*"[^>]*>([\s\S]*?)<\/p>/i)?.[1])
    const [day, month, year] = date.split('/')
    return {
      id: `perugia-official-${index}-${date}`,
      team: 'perugia',
      title: decode(block.match(/class="[^"]*titlenewsbar[^"]*"[^>]*>([\s\S]*?)<\/p>/i)?.[1]),
      url: match[1],
      source: 'Sito ufficiale',
      publishedAt: `${year}-${month}-${day}T12:00:00.000Z`,
      image: block.match(/<img[^>]+src="([^"]+)"/i)?.[1],
    }
  }).filter((item) => item.title && item.url)
}

function altinoItems(json) {
  const posts = JSON.parse(json)
  return posts.map((post, index) => ({
    id: `altino-official-${index}-${post.date_gmt}`,
    team: 'altino',
    title: decode(post.title?.rendered),
    url: post.link,
    source: 'Sito ufficiale',
    publishedAt: new Date(`${post.date_gmt}Z`).toISOString(),
    summary: decode(post.excerpt?.rendered).slice(0, 360) || undefined,
  })).filter((item) => item.title && item.url)
}

async function articleDetails(url) {
  try {
    const html = await get(url)
    return { image: articleImageFromHtml(html), summary: articleSummaryFromHtml(html) }
  } catch {
    return {}
  }
}

const curatedMatese = [
  {
    id: 'matese-punto-sport-stadio-2026-06-18',
    team: 'matese',
    title: 'Polisportiva Matese, si chiude il ciclo Scappaticcio: fine di un percorso importante in Serie B2',
    url: 'https://www.puntosportstadio.it/?p=15905',
    source: 'Punto Sport Stadio',
    publishedAt: '2026-06-18T12:00:00.000Z',
  },
  {
    id: 'matese-volleycloud-2026-06-22',
    team: 'matese',
    title: 'È arrivato il momento… Ciao Polisportiva Matese',
    url: 'https://www.volleycloud.it/2026/06/e-arrivato-il-momento-ciao-polisportiva-matese/',
    source: 'VolleyCloud',
    publishedAt: '2026-06-22T12:00:00.000Z',
  },
  {
    id: 'matese-guiscards-2026-05-03',
    team: 'matese',
    title: 'Santoro Creative Hub regina dei derby: Matese ko',
    url: 'https://www.guiscards.it/2026/05/03/santoro-creative-hub-regina-dei-derby-matese-ko/',
    source: 'Salerno Guiscards',
    publishedAt: '2026-05-03T12:00:00.000Z',
  },
]

const curatedAthletes = [
  {
    id: 'perugia-luca-loreti-2026-06-22',
    team: 'perugia',
    title: 'Luca Loreti è il secondo libero della Sir Susa Scai: «Pronto a dare sempre il massimo!»',
    url: 'https://www.sirsafetyperugia.it/new/luca-loreti-e-il-secondo-libero-della-sir-susa-scai-pronto-a-dare-sempre-il-massimo',
    source: 'Sito ufficiale',
    publishedAt: '2026-06-22T12:00:00.000Z',
    athleteIds: ['luca-loreti'],
  },
]

const athleteSearches = [
  { id: 'chiara-lupoli', name: 'Chiara Lupoli', team: 'matese' },
  { id: 'camilla-lupoli', name: 'Camilla Lupoli', team: 'altino' },
  { id: 'luca-loreti', name: 'Luca Loreti', team: 'perugia' },
]

const googleNewsFeed = (query) => `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=it&gl=IT&ceid=IT:it`
const mateseFilter = (text) => /matese/i.test(text) && /volley|pallavol|serie b2/i.test(text)

const teamSearches = [
  { id: 'altino-media', team: 'altino', label: 'Media: Altino Volley', query: '"Altino Volley" pallavolo', filter: (text) => /altino/i.test(text) && /volley|pallavol/i.test(text) },
  { id: 'matese-media', team: 'matese', label: 'Media: Matese Volley', query: '"Polisportiva Matese" pallavolo OR volley', filter: mateseFilter },
  { id: 'perugia-media', team: 'perugia', label: 'Media: Sir Perugia', query: '"Sir Susa Scai Perugia" volley OR pallavolo', filter: (text) => /perugia/i.test(text) && /volley|pallavol/i.test(text) },
]

const sourceTasks = [
  { id: 'matese-curated', team: 'matese', label: 'Archivio Matese verificato', url: 'https://www.puntosportstadio.it/', run: () => Promise.resolve(curatedMatese) },
  { id: 'athletes-curated', team: null, label: 'Profili atleti verificati', url: '', run: () => Promise.resolve(curatedAthletes) },
  { id: 'altino-official', team: 'altino', label: 'Sito ufficiale Altino', url: 'https://www.altinovolley.it/', run: () => get('https://www.altinovolley.it/wp-json/wp/v2/posts?per_page=30&_fields=date_gmt,link,title,excerpt').then(altinoItems) },
  { id: 'perugia-official', team: 'perugia', label: 'Sito ufficiale Perugia', url: 'https://www.sirsafetyperugia.it/new/', run: () => get('https://www.sirsafetyperugia.it/new/').then(perugiaItems) },
  { id: 'matese-guiscards', team: 'matese', label: 'Salerno Guiscards', url: 'https://www.guiscards.it/', run: () => get('https://www.guiscards.it/feed/').then((xml) => rssItems(xml, 'matese', 'Salerno Guiscards', mateseFilter).slice(0, 6)) },
  { id: 'matese-sportcasertano', team: 'matese', label: 'SportCasertano', url: 'https://www.sportcasertano.it/', run: () => get('https://www.sportcasertano.it/feed/').then((xml) => rssItems(xml, 'matese', 'SportCasertano', mateseFilter).slice(0, 6)) },
  { id: 'matese-puntosport', team: 'matese', label: 'Punto Sport Stadio', url: 'https://www.puntosportstadio.it/', run: () => get('https://www.puntosportstadio.it/?feed=rss2').then((xml) => rssItems(xml, 'matese', 'Punto Sport Stadio', mateseFilter).slice(0, 6)) },
  { id: 'matese-volleycloud', team: 'matese', label: 'VolleyCloud', url: 'https://www.volleycloud.it/', run: () => get('https://www.volleycloud.it/feed/').then((xml) => rssItems(xml, 'matese', 'VolleyCloud', mateseFilter).slice(0, 6)) },
  ...teamSearches.map((source) => ({ ...source, url: googleNewsFeed(source.query), run: () => get(googleNewsFeed(source.query)).then((xml) => rssItems(xml, source.team, source.label, source.filter).slice(0, 8)) })),
  ...athleteSearches.map((athlete) => ({ id: `athlete-${athlete.id}`, team: athlete.team, label: `Atleta: ${athlete.name}`, url: googleNewsFeed(`"${athlete.name}" pallavolo`), run: () => get(googleNewsFeed(`"${athlete.name}" pallavolo`)).then((xml) => rssItems(xml, athlete.team, 'Ricerca notizie').slice(0, 6).map((item) => ({ ...item, athleteIds: [athlete.id] }))) })),
]

const checkedAt = new Date().toISOString()
const results = await Promise.allSettled(sourceTasks.map((source) => source.run()))
const fresh = results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
const sources = sourceTasks.map((source, index) => {
  const result = results[index]
  return {
    id: source.id,
    team: source.team,
    label: source.label,
    url: source.url,
    mode: 'automatic',
    status: result.status === 'fulfilled' ? 'ok' : 'error',
    checkedAt,
    itemsFound: result.status === 'fulfilled' ? result.value.length : 0,
  }
}).concat([
  { id: 'altino-facebook', team: 'altino', label: 'Facebook Altino', url: 'https://www.facebook.com/altinovolley/', mode: 'direct', status: 'link-only', checkedAt, itemsFound: 0 },
  { id: 'altino-instagram', team: 'altino', label: 'Instagram Altino', url: 'https://www.instagram.com/altinovolley.official/', mode: 'direct', status: 'link-only', checkedAt, itemsFound: 0 },
  { id: 'matese-facebook', team: 'matese', label: 'Facebook Matese', url: 'https://www.facebook.com/polisportiva.matese', mode: 'direct', status: 'link-only', checkedAt, itemsFound: 0 },
  { id: 'matese-instagram', team: 'matese', label: 'Instagram Matese', url: 'https://www.instagram.com/polisportivamatese/', mode: 'direct', status: 'link-only', checkedAt, itemsFound: 0 },
  { id: 'perugia-facebook', team: 'perugia', label: 'Facebook Perugia', url: 'https://www.facebook.com/SirSafetyPerugiaVolley/', mode: 'direct', status: 'link-only', checkedAt, itemsFound: 0 },
  { id: 'perugia-instagram', team: 'perugia', label: 'Instagram Perugia', url: 'https://www.instagram.com/sirsafetyperugia/', mode: 'direct', status: 'link-only', checkedAt, itemsFound: 0 },
])
const previous = Array.isArray(fallback.items) ? fallback.items : []
const deduplicated = mergeNewsItems(fresh, previous)
const items = await Promise.all(deduplicated.map(async (item) => {
  const details = item.source === 'Ricerca notizie' || (item.image && item.summary) ? {} : await articleDetails(item.url)
  const summary = item.summary || details.summary
  const matchFocus = item.matchFocus || classifyMatchFocus(`${item.title} ${summary ?? ''}`) || undefined
  return { ...item, image: item.image || details.image, summary, matchFocus }
}))

await writeFile(outputUrl, `${JSON.stringify({ updatedAt: checkedAt, sources, items }, null, 2)}\n`)
const okSources = sources.filter((source) => source.status === 'ok').length
const failedSources = sources.filter((source) => source.status === 'error').length
console.log(`News aggiornate: ${items.length}; fonti automatiche riuscite: ${okSources}; errori: ${failedSources}`)
