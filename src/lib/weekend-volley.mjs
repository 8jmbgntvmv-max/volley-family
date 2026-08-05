import { classifyMatchFocus } from './news-focus.mjs'

const normalized = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('it')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const meaningfulWords = (value) => normalized(value).split(' ').filter((word) => word.length >= 4)

export function nextMatchesByTeam(matches = [], teamIds = [], today = new Date().toISOString().slice(0, 10)) {
  return teamIds.map((team) => matches
    .filter((match) => match.team === team && match.date >= today)
    .sort((first, second) => first.date.localeCompare(second.date))[0]
    ?? null)
}

export function relatedNewsForMatch(match, news = [], limit = 4) {
  if (!match) return []
  const opponentWords = meaningfulWords(match.opponent)
  const matchTime = new Date(`${match.date}T23:59:59Z`).getTime()
  return news.flatMap((item) => {
    if (item.team !== match.team) return []
    const publishedTime = new Date(item.publishedAt).getTime()
    if (!Number.isFinite(publishedTime) || publishedTime > matchTime) return []
    const text = normalized(`${item.title} ${item.summary ?? ''}`)
    const focus = item.matchFocus ?? classifyMatchFocus(text)
    const opponentMentioned = opponentWords.some((word) => text.includes(word))
    const daysBefore = Math.max(0, Math.round((matchTime - publishedTime) / 86_400_000))
    const recent = daysBefore <= 21
    if (!opponentMentioned && !focus) return []
    const score = (opponentMentioned ? 8 : 0) + (focus ? 4 : 0) + (recent ? 2 : 0)
    if (!score) return []
    return [{ ...item, weekendScore: score, opponentMentioned, focus }]
  }).sort((first, second) => second.weekendScore - first.weekendScore || second.publishedAt.localeCompare(first.publishedAt)).slice(0, limit)
}

export function lineupNewsForMatch(match, news = []) {
  return relatedNewsForMatch(match, news, 10).filter((item) => /formazion|sestetto|titolari|schiera|starting six|in campo con/.test(normalized(`${item.title} ${item.summary ?? ''}`))).slice(0, 2)
}
