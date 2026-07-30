import type { Match } from '../data/schedule'
export function chooseHomeMatch(matches: Match[]): Match | null
export function groupByWeekend(matches: Match[]): { key: string; date: string; matches: Match[] }[]
