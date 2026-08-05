import type { TeamId } from '../data/schedule'
export type NewsCatalogSource = { id: string; label: string; url: string; area: string; teams: TeamId[]; searchable: boolean }
export const newsSourceCatalog: NewsCatalogSource[]
export function searchableSourceGroups(team: TeamId, size?: number): string[][]
