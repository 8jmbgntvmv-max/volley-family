export const FIPAV_COMPETITIONS = {
  altino: { serie: 'A2', sesso: 'F', girone: 'U', teamCode: '10929', label: 'Serie A2 Femminile', url: 'https://www.federvolley.it/campionati/serie-a-b#home/2026/A2/F/U', resultsUrl: 'https://www.legavolleyfemminile.it/club/tenaglia-altino-avastese-volley/710969/risultati/?stagione=2026', standingsUrl: 'https://www.legavolleyfemminile.it/classifica/?campionato=710340&stagione=2026', statisticsUrl: 'https://www.legavolleyfemminile.it/club/tenaglia-altino-avastese-volley/710969/stats/?stagione=2026' },
  matese: { serie: 'B2', sesso: 'F', girone: 'H', teamCode: '10387', label: 'Serie B2 Femminile · Girone H', url: 'https://www.federvolley.it/campionati/serie-a-b#home/2026/B2/F/H', resultsUrl: 'https://www.federvolley.it/campionati/serie-a-b#calendario/2026/B2/F/H', standingsUrl: 'https://www.federvolley.it/campionati/serie-a-b#classifica/2026/B2/F/H' },
  perugia: { serie: 'A1', sesso: 'M', girone: 'U', teamCode: '7290', label: 'Serie A1 Maschile', url: 'https://www.federvolley.it/campionati/serie-a-b#home/2026/A1/M/U', resultsUrl: 'https://www.federvolley.it/campionati/serie-a-b#calendario/2026/A1/M/U', standingsUrl: 'https://www.federvolley.it/campionati/serie-a-b#classifica/2026/A1/M/U' },
}

const asNumber = (value) => {
  const result = Number(value)
  return Number.isFinite(result) ? result : 0
}
const dateIso = (value = '') => {
  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null
}
const matchDateTime = (match) => {
  const timestamp = Number(match.ts_gara)
  return Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp * 1000).toISOString() : null
}

export function parseFipavCalendar(payload, teamId, competition = FIPAV_COMPETITIONS[teamId]) {
  const matches = payload?.data?.matches
  if (!Array.isArray(matches)) throw new Error(`Formato calendario FIPAV non riconosciuto (${teamId})`)
  const selected = matches.filter((match) => String(match.team1?.code ?? match.team1?.id) === competition.teamCode || String(match.team2?.code ?? match.team2?.id) === competition.teamCode)
  const minimum = teamId === 'altino' ? 30 : teamId === 'matese' ? 24 : 20
  if (selected.length < minimum) throw new Error(`Calendario FIPAV ${teamId} incompleto: ${selected.length} gare`)

  return selected.map((match) => {
    const home = String(match.team1?.code ?? match.team1?.id) === competition.teamCode
    const opponent = home ? match.team2 : match.team1
    const date = dateIso(match.date)
    if (!date || !opponent?.name) return null
    return {
      id: `${teamId}-${match.ng ?? match.id}`,
      matchNumber: String(match.ng ?? match.id),
      team: teamId,
      date,
      opponent: opponent.shortName || opponent.name,
      home,
      competition: competition.label,
      time: String(match.time ?? '').trim() || undefined,
      venue: [match.stadium, match['stadium-address'], match['stadium-city'], match['stadium-province']].filter(Boolean).join(', ') || undefined,
      sourceUpdatedAt: match.data_ultimo_aggiornamento ?? null,
      _source: { played: match.played === true && String(match.ris_ufficiale ?? '0') === '1', official: String(match.ris_ufficiale ?? '0') === '1', homeSets: asNumber(match['team1-setwin']), awaySets: asNumber(match['team2-setwin']), homePoints: Array.isArray(match.pt_a) ? match.pt_a.map(asNumber) : [], awayPoints: Array.isArray(match.pt_b) ? match.pt_b.map(asNumber) : [], timestamp: matchDateTime(match) },
    }
  }).filter(Boolean)
}

export function parseFipavStandings(payload, teamId, competition = FIPAV_COMPETITIONS[teamId]) {
  const teams = payload?.data?.teams
  if (!Array.isArray(teams)) throw new Error(`Formato classifica FIPAV non riconosciuto (${teamId})`)
  const selected = teams.find((entry) => String(entry.team?.code ?? entry.team?.id) === competition.teamCode)
  if (!selected) throw new Error(`Squadra ${competition.teamCode} non presente nella classifica FIPAV ${teamId}`)
  return {
    position: asNumber(selected.position),
    points: asNumber(selected.points),
    played: asNumber(selected.played),
    wins: asNumber(selected.won),
    losses: asNumber(selected.lost),
    setsWon: asNumber(selected.sets_won),
    setsLost: asNumber(selected.sets_lost),
    pointsWon: asNumber(selected.points_won),
    pointsLost: asNumber(selected.points_lost),
  }
}

export function resultFromFipavMatch(match) {
  const data = match._source
  return {
    matchNumber: match.matchNumber,
    team: match.team,
    date: match.date,
    opponent: match.opponent,
    home: match.home,
    played: data.played,
    official: data.official,
    firstTeamSets: data.homeSets,
    secondTeamSets: data.awaySets,
    sets: Array.from({ length: Math.min(data.homePoints.length, data.awayPoints.length) }, (_, index) => ({ first: data.homePoints[index], second: data.awayPoints[index] })),
    sourceUpdatedAt: match.sourceUpdatedAt,
  }
}

export function publicFixture(match) {
  const { _source: _ignored, sourceUpdatedAt: _updated, ...fixture } = match
  return fixture
}
