import { classifyMatchFocus } from './news-focus.mjs'

const followedNames = ['chiara lupoli', 'camilla lupoli', 'luca loreti']

export function buildUpdateItems(news = [], results = {}, matches = []) {
  const newsItems = news.map((item) => {
    const focus = item.matchFocus || classifyMatchFocus(`${item.title} ${item.summary || ''}`)
    const text = `${item.title} ${item.summary || ''}`.toLocaleLowerCase('it')
    const athleteMention = item.athleteIds?.length || followedNames.some((name) => text.includes(name))
    const kind = athleteMention ? 'athletes' : focus ? 'matches' : 'news'
    return {
      id: `news:${item.id}`,
      team: item.team,
      kind,
      title: item.title,
      detail: focus === 'pre' ? 'Pre-partita' : focus === 'post' ? 'Post-partita' : focus === 'availability' ? 'Assenze e scelte' : athleteMention ? 'Atleti seguiti' : item.source,
      publishedAt: item.publishedAt,
      url: item.url,
    }
  })

  const resultItems = Object.values(results).flatMap((result) => {
    if (!result?.played) return []
    const match = matches.find((candidate) => candidate.matchNumber === result.matchNumber)
    if (!match) return []
    const first = match.home ? match.team : match.opponent
    const second = match.home ? match.opponent : match.team
    const sets = (result.sets || []).map((set) => `${set.first}-${set.second}`).join(', ')
    return [{
      id: `result:${result.matchNumber}:${result.firstTeamSets}-${result.secondTeamSets}:${sets}`,
      team: match.team,
      kind: 'results',
      title: `${first} – ${second}: ${result.firstTeamSets}–${result.secondTeamSets}`,
      detail: sets ? `Risultato ufficiale · ${sets}` : 'Risultato ufficiale',
      publishedAt: result.sourceUpdatedAt || `${match.date}T23:59:00.000Z`,
    }]
  })

  return [...newsItems, ...resultItems].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}
