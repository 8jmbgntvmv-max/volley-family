import type { TeamId } from './schedule'

export type RosterPlayer = {
  name: string
  role?: string
  followed?: boolean
  birthDate?: string
  birthYear?: string
  height?: number
  nationality?: string
  profileUrl?: string
  profileSource?: string
  publicProfiles?: { label: string; url: string }[]
}
export type Roster = { team: TeamId; status: 'complete' | 'updating'; sourceUrl: string; sourceLabel: string; players: RosterPlayer[] }

export const rosters: Roster[] = [
  {
    team: 'altino', status: 'complete', sourceUrl: 'https://www.facebook.com/altinovolley/', sourceLabel: '13 atlete presentate da Altino',
    players: [
      { name: 'Adji Astou Ndoye', role: 'Schiacciatrice', birthDate: '3 aprile 2006', height: 180, nationality: 'Italia', profileUrl: 'https://www.altinovolley.it/adji-ndoye-ancora-in-rossoblu-si-apre-la-terza-stagione-insieme/', profileSource: 'Presentazione ufficiale Altino' },
      { name: 'Gaia Farelli', role: 'Schiacciatrice', birthDate: '31 agosto 2006', height: 186, nationality: 'Italia', profileUrl: 'https://www.altinovolley.it/gaia-farelli-confermata-continuita-e-giovane-energia-per-il-roster-rossoblu/', profileSource: 'Presentazione ufficiale Altino' },
      { name: 'Martina Ferrara', role: 'Libero', birthDate: '28 gennaio 1999', height: 168, nationality: 'Italia', profileUrl: 'https://www.altinovolley.it/primo-colpo-di-mercato-in-rossoblu-martina-ferrara-e-il-nuovo-libero/', profileSource: 'Presentazione ufficiale Altino' },
      { name: 'Sara Stival', role: 'Opposto', birthDate: '27 marzo 2001', height: 182, nationality: 'Italia', profileUrl: 'https://www.altinovolley.it/qualita-ed-energia-in-posto-2-arriva-sara-stival/', profileSource: 'Presentazione ufficiale Altino' },
      { name: 'Amelie Joyce Pixner', role: 'Centrale', birthDate: '29 novembre 2006', height: 188, nationality: 'Austria', profileUrl: 'https://www.altinovolley.it/gioventu-e-prospettiva-al-centro-arriva-amelie-pixner/', profileSource: 'Presentazione ufficiale Altino' },
      { name: 'Ilaria Maiezza', role: 'Libero', birthDate: '19 febbraio 2006', height: 175, nationality: 'Italia', profileUrl: 'https://www.altinovolley.it/ilaria-maiezza-giovane-talento-abruzzese-per-la-seconda-linea-rossoblu/', profileSource: 'Presentazione ufficiale Altino' },
      { name: 'Florencia Ferraro', role: 'Palleggiatrice', birthDate: '22 luglio 2003', height: 170, nationality: 'Italia', profileUrl: 'https://www.altinovolley.it/florencia-ferraro-in-cabina-di-regia-nuovo-innesto-per-il-palleggio-rossoblu/', profileSource: 'Presentazione ufficiale Altino' },
      { name: 'Valentina Omonoyan', role: 'Opposto', birthDate: '8 febbraio 2005', height: 178, nationality: 'Italia', profileUrl: 'https://www.altinovolley.it/valentina-omonoyan-fisicita-e-margini-di-crescita-per-lattacco-rossoblu/', profileSource: 'Presentazione ufficiale Altino' },
      { name: 'Gaia Riva', role: 'Schiacciatrice', birthDate: '17 agosto 2000', height: 178, nationality: 'Italia', profileUrl: 'https://www.altinovolley.it/determinazione-in-banda-gaia-riva-e-rossoblu/', profileSource: 'Presentazione ufficiale Altino' },
      { name: 'Claudia Provaroni', role: 'Schiacciatrice', birthDate: '14 maggio 1998', height: 181, nationality: 'Italia', profileUrl: 'https://www.altinovolley.it/qualita-ed-esperienza-in-banda-arriva-claudia-provaroni/', profileSource: 'Presentazione ufficiale Altino' },
      { name: 'Sara Mori', role: 'Centrale', birthYear: '2008', nationality: 'Italia', profileUrl: 'https://www.altinovolley.it/sara-mori-giovane-prospettiva-al-centro-per-il-roster-rossoblu/', profileSource: 'Presentazione ufficiale Altino' },
      { name: 'Giorgia Bernasconi', role: 'Centrale', birthDate: '16 settembre 2001', height: 184, nationality: 'Italia', profileUrl: 'https://www.altinovolley.it/giorgia-bernasconi-intensita-e-presenza-per-il-centro-rossoblu/', profileSource: 'Presentazione ufficiale Altino' },
      { name: 'Camilla Lupoli', role: 'Palleggiatrice', birthYear: '2003', height: 175, nationality: 'Italia', followed: true, profileUrl: 'https://www.altinovolley.it/camilla-lupoli-in-rossoblu-talento-e-ritmo-al-palleggio/', profileSource: 'Presentazione ufficiale Altino' },
    ],
  },
  {
    team: 'matese', status: 'updating', sourceUrl: 'https://www.instagram.com/polisportivamatese/', sourceLabel: 'Canale ufficiale Matese',
    players: [
      { name: 'Chiara Lupoli', followed: true },
      { name: 'Carola Nasi', role: 'Libero', birthYear: '2001', nationality: 'Italia', profileUrl: 'https://www.instagram.com/p/DbnyDyBCF1d/', profileSource: 'Conferma ufficiale Matese' },
      { name: 'Iole Isabella Avecone', role: 'Schiacciatrice', birthDate: '17 ottobre 2000', height: 185, nationality: 'Italia', profileUrl: 'https://www.facebook.com/share/p/19aHw3rNoA/?mibextid=wwXIfr', profileSource: 'Conferma ufficiale Matese', publicProfiles: [{ label: 'Profilo pubblico Volleybox', url: 'https://women.volleybox.net/iole-isabella-avecone-p161684' }] },
      { name: 'Marlene Silva Ascensao', role: 'Centrale', birthDate: '28 ottobre 1991', height: 182, nationality: 'Italia', profileUrl: 'https://www.facebook.com/share/p/1MRFonQEqB/?mibextid=wwXIfr', profileSource: 'Conferma ufficiale Matese', publicProfiles: [{ label: 'Profilo pubblico Volleybox', url: 'https://women.volleybox.net/marlene-silva-ascensao-p52770' }] },
    ],
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
      { name: 'Marco Gaggini', role: 'Libero' },
      { name: 'Luca Loreti', role: 'Libero', followed: true, birthDate: '24 dicembre 2005', height: 190, nationality: 'Italia', profileUrl: 'https://www.sirsafetyperugia.it/player/luca-loreti', profileSource: 'Profilo ufficiale Perugia', publicProfiles: [{ label: 'Instagram pubblico', url: 'https://www.instagram.com/lucaloretii__/' }] },
    ],
  },
]
