import type { Roster, RosterPlayer } from '../data/rosters'
import type { TeamId } from '../data/schedule'

export type RosterOverrides = { hidden: Partial<Record<TeamId, string[]>>; renamed: Partial<Record<TeamId, Record<string, { name: string; role: string }>>> }
export function emptyRosterOverrides(): RosterOverrides
export function readRosterOverrides(storage?: Storage): RosterOverrides
export function writeRosterOverrides(overrides: RosterOverrides, storage?: Storage): void
export function rosterOverrideKey(player: RosterPlayer): string
export function applyRosterOverrides(rosters: Roster[], overrides?: RosterOverrides): (Roster & { players: (RosterPlayer & { rosterKey: string })[] })[]
export function renameRosterPlayer(overrides: RosterOverrides, team: TeamId, originalName: string, name: string, role: string): RosterOverrides
export function hideRosterPlayer(overrides: RosterOverrides, team: TeamId, originalName: string): RosterOverrides
