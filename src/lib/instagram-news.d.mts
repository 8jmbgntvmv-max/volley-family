import type { TeamId } from '../data/schedule'
export type InstagramNewsItem = { id: string; team: TeamId; title: string; url: string; source: string; publishedAt: string; image?: string; summary: string }
export function instagramVolleyItems(json: string | { items?: unknown[] }, options: { team: TeamId; source: string }): InstagramNewsItem[]
