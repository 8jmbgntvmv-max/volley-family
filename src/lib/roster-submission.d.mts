import type { Roster, RosterPlayer } from '../data/rosters'

export function encodeRosterSubmission(name: string, role?: string): string
export function parseRosterSubmission(value?: string): { name: string; role?: string } | null
export function mergeRosterAnnouncements<T extends RosterPlayer>(rosters: Roster[], news: { team: string; rosterPlayer?: T }[]): Roster[]
