export const priorities = { altino: 1, matese: 2, perugia: 3 }
export function chooseHomeMatch(matches) {
  return [...matches].filter((match) => match.home).sort((a, b) =>
    priorities[a.team] - priorities[b.team] ||
    (a.date ?? '').localeCompare(b.date ?? '') ||
    (a.time ?? '').localeCompare(b.time ?? '')
  )[0] ?? null
}
export function groupByWeekend(matches) {
  const groups = new Map()
  for (const match of matches) {
    const date = new Date(`${match.date}T12:00:00`); const day = date.getDay(); const monday = new Date(date)
    monday.setDate(date.getDate() - ((day + 6) % 7)); const key = monday.toISOString().slice(0, 10)
    const current = groups.get(key) ?? { key, date: match.date, matches: [] }
    if (match.date < current.date) current.date = match.date
    current.matches.push(match); groups.set(key, current)
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key))
}
