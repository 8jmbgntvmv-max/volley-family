export type FamilyBoardKind = 'partita' | 'squadra' | 'logistica' | 'altro'
export type FamilyBoardMessage = {
  id: string
  authorName: string
  kind: FamilyBoardKind
  content: string
  matchId: string | null
  createdAt: string
  ownedByMe: boolean
}
export type FamilyBoardClient = {
  configured: boolean
  clearSession: () => void
  join: (familyCode: string, displayName: string) => Promise<unknown>
  list: () => Promise<FamilyBoardMessage[]>
  post: (message: { content: string; kind: FamilyBoardKind; matchId: string | null }) => Promise<unknown>
  remove: (id: string) => Promise<unknown>
}
export function isFamilyBoardConfigured(config?: { url?: string; anonKey?: string }): boolean
export function validateFamilyBoardPost(value?: string): { valid: false; error: string } | { valid: true; content: string }
export function createFamilyBoardClient(config?: { url?: string; anonKey?: string }, storage?: Storage): FamilyBoardClient
