import type { Match, TeamId } from '../data/schedule'
export type WeekendNews = { id: string; team: TeamId; title: string; url: string; source: string; publishedAt: string; summary?: string; matchFocus?: string; weekendScore?: number; opponentMentioned?: boolean; focus?: string | null }
export function nextMatchesByTeam(matches?: Match[], teamIds?: TeamId[], today?: string): Array<Match | null>
export function relatedNewsForMatch(match: Match | null, news?: WeekendNews[], limit?: number): WeekendNews[]
export function lineupNewsForMatch(match: Match | null, news?: WeekendNews[]): WeekendNews[]
