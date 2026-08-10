const storageKey = 'vf-roster-overrides-v1'

const normalizeName = (value = '') => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('it')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

export function emptyRosterOverrides() {
  return { hidden: {}, renamed: {} }
}

export function readRosterOverrides(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(storageKey) ?? '')
    return {
      hidden: parsed?.hidden && typeof parsed.hidden === 'object' ? parsed.hidden : {},
      renamed: parsed?.renamed && typeof parsed.renamed === 'object' ? parsed.renamed : {},
    }
  } catch {
    return emptyRosterOverrides()
  }
}

export function writeRosterOverrides(overrides, storage = globalThis.localStorage) {
  storage.setItem(storageKey, JSON.stringify(overrides))
}

export function rosterOverrideKey(player) {
  return normalizeName(player.name)
}

export function applyRosterOverrides(rosters, overrides = emptyRosterOverrides()) {
  return rosters.map((roster) => {
    const hidden = new Set(Array.isArray(overrides.hidden?.[roster.team]) ? overrides.hidden[roster.team] : [])
    const renamed = overrides.renamed?.[roster.team] ?? {}
    const players = roster.players.flatMap((player) => {
      const key = rosterOverrideKey(player)
      if (hidden.has(key)) return []
      const edit = renamed[key]
      const next = edit ? { ...player, name: edit.name || player.name, role: edit.role || player.role } : { ...player }
      return [{ ...next, rosterKey: key }]
    })
    return { ...roster, players }
  })
}

export function renameRosterPlayer(overrides, team, originalName, name, role) {
  const key = normalizeName(originalName)
  return {
    ...overrides,
    renamed: {
      ...overrides.renamed,
      [team]: { ...(overrides.renamed?.[team] ?? {}), [key]: { name: name.trim(), role: role.trim() } },
    },
  }
}

export function hideRosterPlayer(overrides, team, originalName) {
  const key = normalizeName(originalName)
  const current = Array.isArray(overrides.hidden?.[team]) ? overrides.hidden[team] : []
  return current.includes(key) ? overrides : { ...overrides, hidden: { ...overrides.hidden, [team]: [...current, key] } }
}
