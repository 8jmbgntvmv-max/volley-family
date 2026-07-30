export type TeamId = 'altino' | 'matese' | 'perugia'
export type Team = { id: TeamId; code: string; name: string; shortName: string; championship: string; priority: number; color: string; softColor: string; status: 'published' | 'pending' }
export type Match = { id: string; team: TeamId; date: string; opponent: string; home: boolean; competition: string; time?: string }
export const teams: Team[] = [
  { id: 'altino', code: 'ALT', name: 'Altino Volley', shortName: 'Altino', championship: 'Serie A2 Femminile', priority: 1, color: '#16834a', softColor: '#def4e8', status: 'pending' },
  { id: 'matese', code: 'MAT', name: 'ASD Matese', shortName: 'Matese', championship: 'Serie B2 Femminile · Girone H', priority: 2, color: '#b98700', softColor: '#fff2c7', status: 'pending' },
  { id: 'perugia', code: 'PG', name: 'Sir Susa Scai Perugia', shortName: 'Perugia', championship: 'SuperLega A1 Maschile', priority: 3, color: '#2467b2', softColor: '#e1edfb', status: 'published' },
]
export const matches: Match[] = [
  ['2026-10-18','Cuneo Volley',false],['2026-10-25','Tinet Prata di Pordenone',true],['2026-11-01','Vero Volley Monza',false],['2026-11-04','Cisterna Volley',true],['2026-11-08','Itas Trentino',false],['2026-11-22','Gas Sales Bluenergy Piacenza',false],['2026-11-29','Valsa Group Modena',true],['2026-12-02','Allianz Milano',false],['2026-12-06','Rana Verona',true],['2026-12-13','Cucine Lube Civitanova',true],['2026-12-20','Pallavolo Padova',true],['2026-12-26','Cisterna Volley',false],['2027-01-03','Allianz Milano',true],['2027-01-10','Tinet Prata di Pordenone',false],['2027-01-13','Gas Sales Bluenergy Piacenza',true],['2027-01-17','Pallavolo Padova',false],['2027-01-24','Itas Trentino',true],['2027-01-31','Rana Verona',false],['2027-02-14','Cuneo Volley',true],['2027-02-21','Valsa Group Modena',false],['2027-02-24','Cucine Lube Civitanova',false],['2027-02-28','Vero Volley Monza',true],
].map(([date, opponent, home], index) => ({ id: `perugia-${index + 1}`, team: 'perugia', date, opponent, home, competition: 'SuperLega' } as Match))
