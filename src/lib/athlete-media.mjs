const googleSearchUrl = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`

export function athleteMediaLinks(name, clubSite) {
  const exactName = `"${name}"`
  const links = [
    { id: 'news', label: 'Google News', detail: 'Articoli recenti', url: `https://news.google.com/search?q=${encodeURIComponent(`${exactName} pallavolo`)}&hl=it&gl=IT&ceid=IT:it` },
    { id: 'web', label: 'Stampa e web', detail: 'Ricerca con nome esatto', url: googleSearchUrl(`${exactName} pallavolo`) },
    { id: 'instagram', label: 'Instagram', detail: 'Profili e post pubblici', url: googleSearchUrl(`site:instagram.com ${exactName} pallavolo`) },
    { id: 'facebook', label: 'Facebook', detail: 'Profili e post pubblici', url: googleSearchUrl(`site:facebook.com ${exactName} pallavolo`) },
    { id: 'youtube', label: 'YouTube', detail: 'Video e interviste', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} pallavolo`)}` },
  ]

  if (clubSite) {
    const host = new URL(clubSite).hostname.replace(/^www\./, '')
    links.push({ id: 'club', label: 'Nel sito della società', detail: host, url: googleSearchUrl(`site:${host} ${exactName}`) })
  }

  return links
}
