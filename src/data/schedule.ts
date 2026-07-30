export type TeamId = 'altino' | 'matese' | 'perugia'
export type Team = { id: TeamId; code: string; name: string; shortName: string; championship: string; priority: number; color: string; softColor: string; status: 'published' | 'pending' }
export type Match = { id: string; team: TeamId; date: string; opponent: string; home: boolean; competition: string; time?: string; venue?: string; matchNumber?: string }
export const teams: Team[] = [
  { id: 'altino', code: 'ALT', name: 'Tenaglia Altino-Vastese Volley', shortName: 'Altino', championship: 'Serie A2 Femminile', priority: 1, color: '#16834a', softColor: '#def4e8', status: 'published' },
  { id: 'matese', code: 'MAT', name: 'FAAM Matese', shortName: 'Matese', championship: 'Serie B2 Femminile · Girone H', priority: 2, color: '#b98700', softColor: '#fff2c7', status: 'published' },
  { id: 'perugia', code: 'PG', name: 'Sir Susa Scai Perugia', shortName: 'Perugia', championship: 'SuperLega A1 Maschile', priority: 3, color: '#2467b2', softColor: '#e1edfb', status: 'published' },
]

const altinoMatches: Match[] = [
  ['2026-10-04','Wash4Green Monviso Volley',true,'17:00'],['2026-10-11','VBC Cremonese',false,'17:00'],['2026-10-14','Bartoccini +energia Perugia',true,'20:30'],['2026-10-18','Sigel Seap Marsala Volley',true,'17:00'],['2026-10-25','Ferraro SMI Roma Volley',false,'17:00'],['2026-11-01','C.B.L. Costa Volpino',true,'17:00'],['2026-11-08','Futura Giovani Busto Arsizio',false,'17:00'],['2026-11-15','Panbiscò Leonessa Altamura',true,'17:00'],
  ['2026-11-18','Akademia Sant’Anna Messina',false,'20:30'],['2026-11-22','Nuvolì Altafratte Padova',false,'17:00'],['2026-12-06','Dragons Offanengo',true,'17:00'],['2026-12-13','Clai Imola Volley',false,'17:00'],['2026-12-16','Club Italia',false,'20:30'],['2026-12-20','Itas Trentino',true,'17:00'],['2026-12-27','Olio Pantaleo Volley Fasano',true,'17:00'],['2027-01-06','Narconon Volley Melendugno',false,'17:00'],
  ['2027-01-10','Wash4Green Monviso Volley',false,'17:00'],['2027-01-17','VBC Cremonese',true,'17:00'],['2027-01-20','Bartoccini +energia Perugia',false,'20:30'],['2027-01-24','Sigel Seap Marsala Volley',false,'17:00'],['2027-01-31','Ferraro SMI Roma Volley',true,'17:00'],['2027-02-03','C.B.L. Costa Volpino',false,'20:30'],['2027-02-07','Futura Giovani Busto Arsizio',true,'17:00'],['2027-02-14','Panbiscò Leonessa Altamura',false,'17:00'],
  ['2027-02-21','Akademia Sant’Anna Messina',true,'17:00'],['2027-02-28','Nuvolì Altafratte Padova',true,'17:00'],['2027-03-07','Dragons Offanengo',false,'17:00'],['2027-03-14','Clai Imola Volley',true,'17:00'],['2027-03-21','Club Italia',true,'17:00'],['2027-03-28','Itas Trentino',false,'17:00'],['2027-04-04','Olio Pantaleo Volley Fasano',false,'17:00'],['2027-04-11','Narconon Volley Melendugno',true,'17:00'],
].map(([date, opponent, home, time], index) => ({ id: `altino-${index + 1}`, team: 'altino', date, opponent, home, time, competition: 'Serie A2' } as Match))

const perugiaMatches: Match[] = [
  ['2026-10-18','Cuneo Volley',false],['2026-10-25','Tinet Prata di Pordenone',true],['2026-11-01','Vero Volley Monza',false],['2026-11-04','Cisterna Volley',true],['2026-11-08','Itas Trentino',false],['2026-11-22','Gas Sales Bluenergy Piacenza',false],['2026-11-29','Valsa Group Modena',true],['2026-12-02','Allianz Milano',false],['2026-12-06','Rana Verona',true],['2026-12-13','Cucine Lube Civitanova',true],['2026-12-20','Pallavolo Padova',true],['2026-12-26','Cisterna Volley',false],['2027-01-03','Allianz Milano',true],['2027-01-10','Tinet Prata di Pordenone',false],['2027-01-13','Gas Sales Bluenergy Piacenza',true],['2027-01-17','Pallavolo Padova',false],['2027-01-24','Itas Trentino',true],['2027-01-31','Rana Verona',false],['2027-02-14','Cuneo Volley',true],['2027-02-21','Valsa Group Modena',false],['2027-02-24','Cucine Lube Civitanova',false],['2027-02-28','Vero Volley Monza',true],
].map(([date, opponent, home], index) => ({ id: `perugia-${index + 1}`, team: 'perugia', date, opponent, home, competition: 'SuperLega' } as Match))

const mateseMatches: Match[] = [
  ['11404','2026-10-17','A.S.D. Poolstars',false,'16:00','Pala LUISS · Pallone B, Roma'],
  ['11411','2026-10-24','LU.VO Barattoli Arzano',true,'18:00','Palamatese, Piedimonte Matese'],
  ['11418','2026-11-01','LUISS SSD',false,'16:30','Pala LUISS · Pallone A, Roma'],
  ['11424','2026-11-07','Green Volley PDP',true,'18:00','Palamatese, Piedimonte Matese'],
  ['11432','2026-11-14','Volley Terracina',false,'17:00','Palacarucci, Terracina'],
  ['11438','2026-11-21','Bizzaglia Pallavolo Pomezia',true,'18:00','Palamatese, Piedimonte Matese'],
  ['11448','2026-11-29','A.S. Roma Centro',false,'16:30','Pala Ferrari, Roma'],
  ['11454','2026-12-05','Farmacie Carbone Priverno',true,'18:00','Palamatese, Piedimonte Matese'],
  ['11462','2026-12-12','A.S.D. ApriliaVolley NumberOne',false,'16:00','Aprilia Sporting Village, Aprilia'],
  ['11468','2026-12-19','ASD Volleyrò CDP Roma',true,'18:00','Palamatese, Piedimonte Matese'],
  ['11477','2027-01-10','Oplonti Penisola Volley World',false,'18:00','Palestra I.I.S. Giancarlo Siani, Napoli'],
  ['11480','2027-01-16','ASD Volley Friends Roma',false,'15:00','PalaVolleyFriends, Roma'],
  ['11487','2027-01-23','Volley Anguillara A.S.D.',true,'18:00','Palamatese, Piedimonte Matese'],
  ['11495','2027-02-13','A.S.D. Poolstars',true,'18:00','Palamatese, Piedimonte Matese'],
  ['11502','2027-02-20','LU.VO Barattoli Arzano',false,'16:00','Palasport Domenico Rea, Arzano'],
  ['11509','2027-02-27','LUISS SSD',true,'18:00','Palamatese, Piedimonte Matese'],
  ['11515','2027-03-06','Green Volley PDP',false,'16:00','Green Sport Arena, Roma'],
  ['11523','2027-03-13','Volley Terracina',true,'18:00','Palamatese, Piedimonte Matese'],
  ['11529','2027-03-20','Bizzaglia Pallavolo Pomezia',false,'17:00','Palestra S.E. Margherita Hack, Pomezia'],
  ['11539','2027-04-03','A.S. Roma Centro',true,'18:00','Palamatese, Piedimonte Matese'],
  ['11545','2027-04-10','Farmacie Carbone Priverno',false,'17:00','Palestra S. Tommaso, Priverno'],
  ['11553','2027-04-17','A.S.D. ApriliaVolley NumberOne',true,'18:00','Palamatese, Piedimonte Matese'],
  ['11559','2027-04-24','ASD Volleyrò CDP Roma',false,'18:00','Pala Andrea Scozzese, Roma'],
  ['11568','2027-05-01','Oplonti Penisola Volley World',true,'18:00','Palamatese, Piedimonte Matese'],
  ['11571','2027-05-08','ASD Volley Friends Roma',true,'18:00','Palamatese, Piedimonte Matese'],
  ['11578','2027-05-15','Volley Anguillara A.S.D.',false,'16:30','Palazzetto dello Sport A. Fagiani, Anguillara Sabazia'],
].map(([matchNumber,date,opponent,home,time,venue],index)=>({id:`matese-${index+1}`,team:'matese',date,opponent,home,time,venue,matchNumber,competition:'Serie B2 · Girone H'} as Match))

export const matches: Match[] = [...altinoMatches, ...mateseMatches, ...perugiaMatches]
