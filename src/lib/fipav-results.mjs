export const FIPAV_MATESE_TEAM_CODE = '10387'

const asNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const isMatese = (team) => String(team?.code ?? team?.id ?? '') === FIPAV_MATESE_TEAM_CODE
  || /\bMATESE\b/i.test(String(team?.name ?? team?.title ?? ''))

export function extractMateseResults(payload) {
  const matches = payload?.data?.matches
  if (!Array.isArray(matches)) throw new Error('Formato calendario FIPAV non riconosciuto')

  const mateseMatches = matches.filter((match) => isMatese(match.team1) || isMatese(match.team2))
  if (mateseMatches.length < 20) throw new Error(`Calendario Matese incompleto: ${mateseMatches.length} gare`)

  return mateseMatches.map((match) => {
    const official = String(match.ris_ufficiale ?? '0') === '1'
    const played = match.played === true && official
    const firstPoints = Array.isArray(match.pt_a) ? match.pt_a.map(asNumber) : []
    const secondPoints = Array.isArray(match.pt_b) ? match.pt_b.map(asNumber) : []
    const setCount = Math.min(firstPoints.length, secondPoints.length)

    return {
      matchNumber: String(match.ng ?? match.id ?? ''),
      played,
      official,
      firstTeamSets: asNumber(match['team1-setwin']),
      secondTeamSets: asNumber(match['team2-setwin']),
      sets: Array.from({ length: setCount }, (_, index) => ({ first: firstPoints[index], second: secondPoints[index] })),
      sourceUpdatedAt: match.data_ultimo_aggiornamento ?? null,
    }
  }).filter((result) => result.matchNumber)
}
