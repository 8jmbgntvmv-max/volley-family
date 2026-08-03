import type { TeamId } from './schedule'

export type RosterPlayer = { name: string; role?: string; followed?: boolean }
export type Roster = { team: TeamId; status: 'complete' | 'updating'; sourceUrl: string; sourceLabel: string; players: RosterPlayer[] }

export const rosters: Roster[] = [
  {
    team: 'altino', status: 'updating', sourceUrl: 'https://www.altinovolley.it/', sourceLabel: 'Annunci ufficiali Altino',
    players: [
      { name: 'Camilla Lupoli', role: 'Palleggiatrice', followed: true },
      { name: 'Giorgia Bernasconi', role: 'Centrale' },
      { name: 'Sara Mori', role: 'Centrale' },
      { name: 'Claudia Provaroni', role: 'Schiacciatrice' },
      { name: 'Gaia Riva', role: 'Schiacciatrice' },
    ],
  },
  {
    team: 'matese', status: 'updating', sourceUrl: 'https://www.facebook.com/polisportiva.matese', sourceLabel: 'Canale ufficiale Matese',
    players: [{ name: 'Chiara Lupoli', followed: true }],
  },
  {
    team: 'perugia', status: 'complete', sourceUrl: 'https://www.sirsafetyperugia.it/players', sourceLabel: 'Roster ufficiale Perugia',
    players: [
      { name: 'Simone Giannelli', role: 'Palleggiatore' }, { name: 'Stefano Cappadona', role: 'Palleggiatore' },
      { name: 'Ferre Reggers', role: 'Opposto' }, { name: 'David Kollàtor', role: 'Opposto' },
      { name: 'Agustin Loser', role: 'Centrale' }, { name: 'Sebastian Solè', role: 'Centrale' },
      { name: 'Giovanni Sanguinetti', role: 'Centrale' }, { name: 'Federico Crosato', role: 'Centrale' },
      { name: 'Mathis Henno', role: 'Schiacciatore' }, { name: 'Kamil Semeniuk', role: 'Schiacciatore' },
      { name: 'Oleh Plotnytskyi', role: 'Schiacciatore' }, { name: 'Seyed Matin Hosseini', role: 'Schiacciatore' },
      { name: 'Marco Gaggini', role: 'Libero' }, { name: 'Luca Loreti', role: 'Libero', followed: true },
    ],
  },
]
