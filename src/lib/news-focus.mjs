export function classifyMatchFocus(text) {
  const value = String(text ?? '').toLocaleLowerCase('it')
  if (/infortun|indisponib|assen[zt]|non convoc|recuper[oa]|problema fisic|scelta tecnic|turnover/.test(value)) return 'availability'
  if (/post[ -]?partita|dopo (?:la )?gara|commenta|vittoria|sconfitta|\bko\b|rimonta|batte|supera|vince|finale/.test(value)) return 'post'
  if (/pre[ -]?partita|vigilia|in vista (?:del|della|di)|verso (?:il|la)|presenta (?:la|il)|prossima gara/.test(value)) return 'pre'
  return null
}
