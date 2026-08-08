const prefix = 'VF_ROSTER|'

const normalizeName = (value = '') => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('it')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

export function encodeRosterSubmission(name, role) {
  return `${prefix}${encodeURIComponent(String(role ?? '').trim())}|${encodeURIComponent(String(name ?? '').trim())}`
}

export function parseRosterSubmission(value = '') {
  if (!value.startsWith(prefix)) return null
  const [encodedRole = '', encodedName = ''] = value.slice(prefix.length).split('|')
  try {
    const name = decodeURIComponent(encodedName).trim()
    const role = decodeURIComponent(encodedRole).trim()
    return name ? { name, role: role || undefined } : null
  } catch {
    return null
  }
}

export function mergeRosterAnnouncements(rosters, news) {
  return rosters.map((roster) => {
    const additions = news
      .filter((item) => item.team === roster.team && item.rosterPlayer?.name)
      .flatMap((item) => {
        const names = item.rosterPlayer.name.split(/\s+(?:e|&)\s+/i).map((name) => name.trim()).filter(Boolean)
        return names.map((name) => ({ ...item.rosterPlayer, name }))
      })
    const players = [...roster.players]
    for (const addition of additions) {
      const index = players.findIndex((player) => normalizeName(player.name) === normalizeName(addition.name))
      if (index < 0) players.push(addition)
      else players[index] = {
        ...addition,
        ...players[index],
        role: players[index].role || addition.role,
        profileUrl: addition.profileUrl || players[index].profileUrl,
        profileSource: addition.profileSource || players[index].profileSource,
      }
    }
    return { ...roster, players }
  })
}
