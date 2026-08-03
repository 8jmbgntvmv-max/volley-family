export function googleMapsDirectionsUrl(venue) {
  const destination = String(venue ?? '').trim()
  if (!destination) return null

  const query = new URLSearchParams({
    api: '1',
    destination,
    dir_action: 'navigate',
  })
  return `https://www.google.com/maps/dir/?${query.toString()}`
}
