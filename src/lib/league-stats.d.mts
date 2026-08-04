export type PlayerStats = {
  name: string
  profileUrl: string
  appearances: number | null
  points: number | null
  attacks: number | null
  attackPoints: number | null
  attackPercentage: number | null
  serves: number | null
  aces: number | null
  blocks: number | null
  serveErrors: number | null
  perfectReceptions: number | null
}
export function parseLfvPlayerStats(html: string, baseUrl?: string): PlayerStats[]
