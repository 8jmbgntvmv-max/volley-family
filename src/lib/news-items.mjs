export function mergeNewsItems(...collections) {
  const byUrl = new Map()
  for (const item of collections.flat()) {
    if (!item?.url || !item?.title || !item?.publishedAt) continue
    const existing = byUrl.get(item.url)
    byUrl.set(item.url, existing ? { ...item, ...existing, image: existing.image || item.image } : item)
  }
  return [...byUrl.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 18)
}
