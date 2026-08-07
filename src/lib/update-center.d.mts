import type { Match, TeamId } from '../data/schedule'

export type UpdateKind = 'news' | 'results' | 'matches' | 'athletes'
export type UpdateItem = { id: string; team: TeamId; kind: UpdateKind; title: string; detail: string; publishedAt: string; url?: string }
export function buildUpdateItems(news?: unknown[], results?: Record<string, unknown>, matches?: Match[]): UpdateItem[]
export function unreadUpdateItems(items?: UpdateItem[], seenIds?: Set<string>): UpdateItem[]
export function updateDateKey(date?: Date): string
export function todaysUpdateItems(items?: UpdateItem[], today?: string): UpdateItem[]
