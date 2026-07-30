import { readFile, writeFile } from 'node:fs/promises'

const fallback = JSON.parse(await readFile(new URL('../public/news.json', import.meta.url), 'utf8'))
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
  const response = await fetch(url, { headers: { 'user-agent': 'VolleyFamily/1.0 (+https://github.com/8jmbgntvmv-max/volley-family)' } })
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return response.text()
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
    const image = block.match(/<media:content[^>]+url=["']([^"']+)/i)?.[1] ?? block.match(/<enclosure[^>]+url=["']([^"']+)/i)?.[1]
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

const results = await Promise.allSettled([
  Promise.resolve(curatedMatese),
  get('https://www.altinovolley.it/feed/').then((xml) => rssItems(xml, 'altino', 'Sito ufficiale').slice(0, 5)),
  get('https://www.sirsafetyperugia.it/new/').then(perugiaItems),
  get('https://www.guiscards.it/feed/').then((xml) => rssItems(xml, 'matese', 'Salerno Guiscards', (text) => /matese/i.test(text) && /volley|pallavol|serie b2/i.test(text)).slice(0, 4)),
  get('https://www.sportcasertano.it/feed/').then((xml) => rssItems(xml, 'matese', 'SportCasertano', (text) => /matese/i.test(text) && /volley|pallavol|serie b2/i.test(text)).slice(0, 4)),
  get('https://www.puntosportstadio.it/?feed=rss2').then((xml) => rssItems(xml, 'matese', 'Punto Sport Stadio', (text) => /matese/i.test(text) && /volley|pallavol|serie b2/i.test(text)).slice(0, 4)),
  get('https://www.volleycloud.it/feed/').then((xml) => rssItems(xml, 'matese', 'VolleyCloud', (text) => /matese/i.test(text) && /volley|pallavol|serie b2/i.test(text)).slice(0, 4)),
])

const fresh = results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
const previous = Array.isArray(fallback.items) ? fallback.items : []
const items = [...fresh, ...previous]
  .filter((item, index, all) => all.findIndex((candidate) => candidate.url === item.url) === index)
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  .slice(0, 18)

await writeFile(new URL('../public/news.json', import.meta.url), `${JSON.stringify({ updatedAt: new Date().toISOString(), items }, null, 2)}\n`)
console.log(`News aggiornate: ${items.length}`)
