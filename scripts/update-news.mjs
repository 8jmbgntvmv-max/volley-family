import { readFile, writeFile } from 'node:fs/promises'
import { articleImageFromHtml } from '../src/lib/news-image.mjs'
import { mergeNewsItems } from '../src/lib/news-items.mjs'

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
    return { id: `${team}-${source}-${index}-${publishedAt}`, team, title, url, source, publishedAt, image, search: `${title} ${description}` }
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

async function articleImage(url) {
  try {
    const html = await get(url)
    return articleImageFromHtml(html)
  } catch {
    return undefined
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

const googleNewsFeed = (name) => `https://news.google.com/rss/search?q=${encodeURIComponent(`"${name}" pallavolo`)}&hl=it&gl=IT&ceid=IT:it`

const results = await Promise.allSettled([
  Promise.resolve(curatedMatese),
  Promise.resolve(curatedAthletes),
  get('https://www.altinovolley.it/feed/').then((xml) => rssItems(xml, 'altino', 'Sito ufficiale').slice(0, 5)),
  get('https://www.sirsafetyperugia.it/new/').then(perugiaItems),
  get('https://www.guiscards.it/feed/').then((xml) => rssItems(xml, 'matese', 'Salerno Guiscards', (text) => /matese/i.test(text) && /volley|pallavol|serie b2/i.test(text)).slice(0, 4)),
  get('https://www.sportcasertano.it/feed/').then((xml) => rssItems(xml, 'matese', 'SportCasertano', (text) => /matese/i.test(text) && /volley|pallavol|serie b2/i.test(text)).slice(0, 4)),
  get('https://www.puntosportstadio.it/?feed=rss2').then((xml) => rssItems(xml, 'matese', 'Punto Sport Stadio', (text) => /matese/i.test(text) && /volley|pallavol|serie b2/i.test(text)).slice(0, 4)),
  get('https://www.volleycloud.it/feed/').then((xml) => rssItems(xml, 'matese', 'VolleyCloud', (text) => /matese/i.test(text) && /volley|pallavol|serie b2/i.test(text)).slice(0, 4)),
  ...athleteSearches.map((athlete) => get(googleNewsFeed(athlete.name)).then((xml) => rssItems(xml, athlete.team, 'Ricerca notizie').slice(0, 5).map((item) => ({ ...item, athleteIds: [athlete.id] })))),
])

const fresh = results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
const previous = Array.isArray(fallback.items) ? fallback.items : []
const deduplicated = mergeNewsItems(fresh, previous)
const items = await Promise.all(deduplicated.map(async (item) => item.image || item.source === 'Ricerca notizie' ? item : { ...item, image: await articleImage(item.url) }))

await writeFile(outputUrl, `${JSON.stringify({ updatedAt: new Date().toISOString(), items }, null, 2)}\n`)
console.log(`News aggiornate: ${items.length}`)
