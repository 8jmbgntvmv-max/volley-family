import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { groupByWeekend } from './lib/decision.mjs'
import { googleMapsDirectionsUrl } from './lib/maps.mjs'
import { classifyMatchFocus, type MatchFocus } from './lib/news-focus.mjs'
import { matches, teams, type Match, type TeamId } from './data/schedule'
import { rosters } from './data/rosters'

type Screen = 'home' | 'agenda' | 'teams' | 'news' | 'rules'
type AthleteId = 'chiara-lupoli' | 'camilla-lupoli' | 'luca-loreti'
type NewsItem = { id: string; team: TeamId; title: string; url: string; source: string; publishedAt: string; image?: string; athleteIds?: AthleteId[]; summary?: string; matchFocus?: MatchFocus }
type MatchResult = { matchNumber: string; played: boolean; official: boolean; firstTeamSets: number; secondTeamSets: number; sets: { first: number; second: number }[] }
type ResultsByMatch = Record<string, MatchResult>
type LeagueTeamData = { source: string; season: string; links: { results?: string; standings?: string; statistics?: string }; standing: null | { position?: number; points?: number; played?: number; wins?: number; losses?: number; setsWon?: number; setsLost?: number }; stats: null | { played?: number; wins?: number; losses?: number; setsWon?: number; setsLost?: number } }
type LeagueData = { updatedAt: string | null; teams: Record<TeamId, LeagueTeamData> }
const nav: { id: Screen; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '⌂' }, { id: 'agenda', label: 'Confronto', icon: '▦' },
  { id: 'teams', label: 'Squadre', icon: '●' }, { id: 'news', label: 'News', icon: '◉' },
  { id: 'rules', label: 'Regole', icon: '✓' },
]
const sources = {
  altino: { site: 'https://www.altinovolley.it/', instagram: 'https://www.instagram.com/altinovolley.official/', facebook: 'https://www.facebook.com/altinovolley/', youtube: 'https://www.youtube.com/@asdaltinovolley' },
  matese: { instagram: 'https://www.instagram.com/polisportivamatese/', facebook: 'https://www.facebook.com/polisportiva.matese' },
  perugia: { site: 'https://www.sirsafetyperugia.it/new/', instagram: 'https://www.instagram.com/sirsafetyperugia/', facebook: 'https://www.facebook.com/SirSafetyPerugiaVolley/', youtube: 'https://www.youtube.com/channel/UCaqDD5gvrybIDsgltOQdzog/' },
}
const athletes: { id: AthleteId; name: string; team: TeamId }[] = [
  { id: 'chiara-lupoli', name: 'Chiara Lupoli', team: 'matese' },
  { id: 'camilla-lupoli', name: 'Camilla Lupoli', team: 'altino' },
  { id: 'luca-loreti', name: 'Luca Loreti', team: 'perugia' },
]
const longDate = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
const dateLabel = (value: string) => longDate.format(new Date(`${value}T12:00:00`))
const scoreLabel = (result: MatchResult) => `${result.firstTeamSets}–${result.secondTeamSets}`
const setsLabel = (result: MatchResult) => result.sets.map((set) => `${set.first}-${set.second}`).join(', ')

function MatchRow({ match, result }: { match: Match; result?: MatchResult }) {
  const team = teams.find((item) => item.id === match.team)!
  const mapsUrl = googleMapsDirectionsUrl(match.venue)
  return <article className="match-row">
    <span className="team-dot" style={{ background: team.color }} />
    <div className="match-copy"><strong>{team.shortName} · {match.home ? 'Casa' : 'Trasferta'}</strong><span>{match.home ? `${team.shortName} – ${match.opponent}` : `${match.opponent} – ${team.shortName}`}</span></div>
    <div className={`match-meta ${result?.played ? 'has-result' : ''}`}><strong>{result?.played ? scoreLabel(result) : match.time ?? 'Orario da definire'}</strong><span>{result?.played ? `Ufficiale FIPAV${setsLabel(result) ? ` · ${setsLabel(result)}` : ''}` : `${match.venue ?? match.competition}${match.matchNumber ? ` · gara ${match.matchNumber}` : ''}`}</span></div>
    {mapsUrl && <a className="maps-link" href={mapsUrl} target="_blank" rel="noreferrer" aria-label={`Avvia Google Maps verso ${match.venue}`}>Indicazioni</a>}
  </article>
}

function ComparisonCell({ teamId, weekMatches, results }: { teamId: TeamId; weekMatches: Match[]; results: ResultsByMatch }) {
  const team = teams.find((item) => item.id === teamId)!
  const teamMatches = weekMatches.filter((match) => match.team === teamId)
  return <div className="compare-column">
    <div className="compare-team"><span className="team-dot" style={{ background: team.color }} /><strong>{team.shortName}</strong></div>
    {teamMatches.length ? teamMatches.map((match) => { const result = match.matchNumber ? results[match.matchNumber] : undefined; const mapsUrl = googleMapsDirectionsUrl(match.venue); return <div className={`compare-match ${match.home ? 'home' : 'away'}`} key={match.id}>
      <span className="where">{match.home ? 'IN CASA' : 'TRASFERTA'}</span>
      <div className="compare-opponent"><strong>{match.opponent}</strong>{result?.played && <b>{scoreLabel(result)}</b>}</div>
      <small>{dateLabel(match.date)} · {result?.played ? `finale FIPAV${setsLabel(result) ? ` · ${setsLabel(result)}` : ''}` : `${match.time ?? 'orario da definire'}${match.venue ? ` · ${match.venue}` : ''}`}</small>
      {mapsUrl && <a className="maps-link compact" href={mapsUrl} target="_blank" rel="noreferrer" aria-label={`Avvia Google Maps verso ${match.venue}`}>Apri Google Maps</a>}
    </div> }) : <div className="compare-empty">{team.status === 'pending' ? 'Calendario in attesa' : 'Non gioca'}</div>}
  </div>
}

function NewsCard({ item }: { item: NewsItem }) {
  const team = teams.find((candidate) => candidate.id === item.team)!
  return <a className="news-card" href={item.url} target="_blank" rel="noreferrer">
    <div className="news-preview" style={{ background: `linear-gradient(145deg, ${team.color}, ${team.softColor})` }}><span>{team.code}</span>{item.image && <img src={item.image} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} />}</div>
    <div className="news-card-copy"><span className="news-source"><i style={{ background: team.color }} />{team.shortName} · {item.source}</span><strong>{item.title}</strong><time>{dateLabel(item.publishedAt.slice(0, 10))}</time></div>
  </a>
}

function AthleteFocus({ news }: { news: NewsItem[] }) {
  return <section className="athlete-focus" aria-labelledby="athlete-focus-title">
    <div className="athlete-focus-heading"><div><p className="eyebrow">Osservatorio personale</p><h3 id="athlete-focus-title">I nostri atleti</h3></div><span>Ricerca automatica</span></div>
    <p className="athlete-focus-note">Citazioni trovate nelle fonti web pubbliche e nei canali ufficiali accessibili. Ogni notizia apre la fonte originale.</p>
    <div className="athlete-grid">{athletes.map((athlete) => {
      const team = teams.find((candidate) => candidate.id === athlete.team)!
      const mentions = news.filter((item) => item.athleteIds?.includes(athlete.id) || item.title.toLocaleLowerCase('it').includes(athlete.name.toLocaleLowerCase('it'))).slice(0, 3)
      return <article className="athlete-card" key={athlete.id}>
        <div className="athlete-card-heading"><span className="team-badge" style={{ background: team.softColor, color: team.color }}>{team.code}</span><div><strong>{athlete.name}</strong><small>{team.shortName}</small></div></div>
        {mentions.length ? <div className="athlete-links">{mentions.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.id}><span>{item.source}</span>{item.title}</a>)}</div> : <p>Nessuna nuova citazione pubblica trovata. Il controllo automatico resta attivo.</p>}
      </article>
    })}</div>
  </section>
}

const focusGroups: { id: MatchFocus; title: string; empty: string }[] = [
  { id: 'pre', title: 'Pre-partita', empty: 'Nessun commento pre-partita pubblicato.' },
  { id: 'post', title: 'Post-partita', empty: 'Nessun commento post-partita pubblicato.' },
  { id: 'availability', title: 'Assenze e scelte', empty: 'Nessuna indisponibilità o scelta tecnica riportata.' },
]
const focusFor = (item: NewsItem) => item.matchFocus ?? classifyMatchFocus(`${item.title} ${item.summary ?? ''}`)

function HomeMatchFocus({ news, onOpenNews }: { news: NewsItem[]; onOpenNews: () => void }) {
  return <section className="home-dashboard focus-dashboard" aria-labelledby="home-focus-title">
    <div className="dashboard-heading"><div><p className="eyebrow">Aggiornamenti partita</p><h2 id="home-focus-title">Pre e post partita</h2></div><button className="text-button" onClick={onOpenNews}>Tutte le news</button></div>
    <p className="dashboard-note">Sintesi delle fonti pubbliche. Assenze, infortuni e scelte tecniche compaiono soltanto quando sono riportati esplicitamente dalla fonte.</p>
    <div className="focus-grid">{focusGroups.map((group) => {
      const items = news.filter((item) => item.publishedAt.slice(0, 10) >= '2026-08-01' && focusFor(item) === group.id).slice(0, 2)
      return <article className={`focus-card ${group.id}`} key={group.id}><div className="focus-card-title"><span>{group.id === 'pre' ? 'PRIMA' : group.id === 'post' ? 'DOPO' : 'ROSA'}</span><strong>{group.title}</strong></div>{items.length ? <div className="focus-links">{items.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.id}><small>{item.source === 'Sito ufficiale' ? 'Fonte ufficiale' : 'Fonte giornalistica'} · {dateLabel(item.publishedAt.slice(0, 10))}</small><strong>{item.title}</strong>{item.summary && <span>{item.summary}</span>}</a>)}</div> : <p>{group.empty}<br /><b>Monitoraggio automatico attivo.</b></p>}</article>
    })}</div>
  </section>
}

function HomeRosters() {
  return <section className="home-dashboard" aria-labelledby="home-rosters-title"><div className="dashboard-heading"><div><p className="eyebrow">Stagione 2026/27</p><h2 id="home-rosters-title">Roster</h2></div></div><p className="dashboard-note">Sono mostrati soltanto i nomi già annunciati. Le rose incomplete si aggiornano con le comunicazioni delle società.</p><div className="roster-grid">{rosters.map((roster) => {
    const team = teams.find((candidate) => candidate.id === roster.team)!
    return <details className="roster-card" key={roster.team}><summary><span className="team-badge" style={{ background: team.softColor, color: team.color }}>{team.code}</span><div><strong>{team.shortName}</strong><small>{roster.status === 'complete' ? `${roster.players.length} atleti · completo` : `${roster.players.length} annunciati · in aggiornamento`}</small></div><b>＋</b></summary><div className="roster-list">{roster.players.map((player) => <div className={player.followed ? 'followed' : ''} key={player.name}><span>{player.name}{player.followed && <i>SEGUITO</i>}</span><small>{player.role ?? 'Ruolo da pubblicare'}</small></div>)}</div><a className="roster-source" href={roster.sourceUrl} target="_blank" rel="noreferrer">{roster.sourceLabel}</a></details>
  })}</div></section>
}

function HomeResultsAndStandings({ results, leagueData }: { results: ResultsByMatch; leagueData: LeagueData | null }) {
  return <section className="home-dashboard" aria-labelledby="home-results-title"><div className="dashboard-heading"><div><p className="eyebrow">Campionati</p><h2 id="home-results-title">Risultati e classifiche</h2></div></div><p className="dashboard-note">La stagione non è ancora iniziata: i dati 2025/26 non vengono mescolati con il nuovo campionato.</p><div className="scoreboard-grid"><article className="scoreboard-card"><h3>Ultimi risultati</h3>{teams.map((team) => {
    const played = matches.filter((match) => match.team === team.id && match.matchNumber && results[match.matchNumber]?.played).sort((a, b) => b.date.localeCompare(a.date))[0]
    const result = played?.matchNumber ? results[played.matchNumber] : undefined
    return <div className="scoreboard-row" key={team.id}><span className="team-dot" style={{ background: team.color }} /><div><strong>{team.shortName}</strong><small>{played ? `${played.home ? team.shortName : played.opponent} – ${played.home ? played.opponent : team.shortName}` : 'In attesa della prima giornata'}</small></div><b>{result ? scoreLabel(result) : '—'}</b></div>
  })}</article><article className="scoreboard-card"><h3>Classifiche 2026/27</h3>{teams.map((team) => { const official = leagueData?.teams[team.id]; return <div className="scoreboard-row" key={team.id}><span className="team-dot" style={{ background: team.color }} /><div><strong>{team.shortName}</strong><small>{official?.standing?.played ? `${official.standing.points ?? 0} punti · ${official.source}` : 'In attesa della prima classifica'}</small></div><b>{official?.standing?.played && official.standing.position ? `${official.standing.position}ª` : '—'}</b></div> })}<p className="standings-note">Le posizioni appariranno dopo la pubblicazione della prima classifica ufficiale.</p></article></div></section>
}

function teamScore(match: Match, result: MatchResult) {
  return match.home
    ? { teamSets: result.firstTeamSets, opponentSets: result.secondTeamSets }
    : { teamSets: result.secondTeamSets, opponentSets: result.firstTeamSets }
}

function HomeStatistics({ results, leagueData }: { results: ResultsByMatch; leagueData: LeagueData | null }) {
  return <section className="home-dashboard" aria-labelledby="home-statistics-title"><div className="dashboard-heading"><div><p className="eyebrow">Numeri della stagione</p><h2 id="home-statistics-title">Statistiche</h2></div></div><p className="dashboard-note">Altino è collegata alla Lega Volley Femminile A2, Perugia alla Lega Pallavolo Serie A e Matese alla FIPAV nazionale. Le statistiche individuali appariranno soltanto quando saranno pubblicate dalla competizione.</p><div className="league-source-grid">{teams.map((team) => { const official = leagueData?.teams[team.id]; return official?.links.statistics || official?.links.results ? <a href={official.links.statistics ?? official.links.results} target="_blank" rel="noreferrer" key={team.id}><span className="team-dot" style={{ background: team.color }} />{team.shortName}<small>{official.source}</small></a> : null })}</div><div className="scoreboard-grid"><article className="scoreboard-card"><h3>Ultima partita</h3>{teams.map((team) => {
    const played = matches.filter((match) => match.team === team.id && match.matchNumber && results[match.matchNumber]?.played).sort((a, b) => b.date.localeCompare(a.date))[0]
    const result = played?.matchNumber ? results[played.matchNumber] : undefined
    return <div className="stat-match" key={team.id}><div className="scoreboard-row"><span className="team-dot" style={{ background: team.color }} /><div><strong>{team.shortName}</strong><small>{played ? `${dateLabel(played.date)} · ${played.opponent}` : 'Statistiche dopo la prima gara'}</small></div><b>{result ? scoreLabel(result) : '—'}</b></div>{result && <p>Parziali: {setsLabel(result)}</p>}</div>
  })}</article><article className="scoreboard-card"><h3>Andamento campionato</h3>{teams.map((team) => {
    const played = matches.flatMap((match) => {
      if (match.team !== team.id || !match.matchNumber || !results[match.matchNumber]?.played) return []
      const result = results[match.matchNumber]
      return [{ match, result, score: teamScore(match, result) }]
    })
    const wins = played.filter((item) => item.score.teamSets > item.score.opponentSets).length
    const setsFor = played.reduce((total, item) => total + item.score.teamSets, 0)
    const setsAgainst = played.reduce((total, item) => total + item.score.opponentSets, 0)
    const points = played.reduce((total, item) => {
      const { teamSets, opponentSets } = item.score
      if (teamSets === 3) return total + (opponentSets === 2 ? 2 : 3)
      if (teamSets === 2 && opponentSets === 3) return total + 1
      return total
    }, 0)
    const official = leagueData?.teams[team.id]
    const officialStats = team.id === 'altino' ? official?.stats : team.id === 'perugia' ? official?.standing : null
    return <div className="championship-stat" key={team.id}><div><span className="team-dot" style={{ background: team.color }} /><strong>{team.shortName}</strong></div>{officialStats?.played ? <p><b>{officialStats.played}</b> gare · <b>{officialStats.wins ?? 0}</b> V · <b>{officialStats.losses ?? 0}</b> P · set <b>{officialStats.setsWon ?? 0}–{officialStats.setsLost ?? 0}</b>{official?.standing?.points !== undefined && ` · ${official.standing.points} pt`}</p> : played.length ? <p><b>{played.length}</b> gare · <b>{wins}</b> V · <b>{played.length - wins}</b> P · set <b>{setsFor}–{setsAgainst}</b> · <b>{points}</b> pt</p> : <p>In attesa della prima gara ufficiale.</p>}</div>
  })}</article></div></section>
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [teamFilter, setTeamFilter] = useState<TeamId | 'all'>('all')
  const [newsFilter, setNewsFilter] = useState<TeamId | 'all'>('all')
  const [news, setNews] = useState<NewsItem[]>([])
  const [results, setResults] = useState<ResultsByMatch>({})
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null)
  const weekends = useMemo(() => groupByWeekend(matches), [])
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}news.json`).then((response) => response.json()).then((data) => setNews(data.items ?? [])).catch(() => setNews([]))
    fetch(`${import.meta.env.BASE_URL}results.json`).then((response) => response.json()).then((data) => setResults(Object.fromEntries((data.items ?? []).map((item: MatchResult) => [item.matchNumber, item])))).catch(() => setResults({}))
    fetch(`${import.meta.env.BASE_URL}league-data.json`).then((response) => response.json()).then(setLeagueData).catch(() => setLeagueData(null))
  }, [])
  return <div className="app-shell">
    <header className="topbar"><div><p className="eyebrow">Stagione 2026/27</p><h1>Volley Family</h1></div><div className="app-mark">VF</div></header>
    <main className="content">
      {screen === 'home' && <>
        <section className="hero-card"><p className="eyebrow light">Agenda condivisa</p><h2>Tutte le partite, senza suggerimenti</h2><p>Consulta liberamente gare in casa e trasferte di Altino, Matese e Perugia.</p><button onClick={() => setScreen('agenda')}>Apri i calendari</button></section>
        <HomeMatchFocus news={news} onOpenNews={() => setScreen('news')} />
        <HomeRosters />
        <HomeResultsAndStandings results={results} leagueData={leagueData} />
        <HomeStatistics results={results} leagueData={leagueData} />
        <section className="section-block"><div className="section-title"><div><p className="eyebrow">Le tue squadre</p><h2>Tre campionati, un’unica agenda</h2></div><button className="text-button" onClick={() => setScreen('teams')}>Vedi tutte</button></div>
          <div className="team-grid">{teams.map((team) => <button className="team-card" key={team.id} onClick={() => { setTeamFilter(team.id); setScreen('teams') }}><span className="team-badge" style={{ background: team.softColor, color: team.color }}>{team.code}</span><strong>{team.shortName}</strong><small>{team.championship}</small></button>)}</div>
        </section>
        <section className="rule-summary"><span className="check">▦</span><div><p className="eyebrow">Calendario neutrale</p><h2>Decidi tu quale partita seguire</h2><p>L’app non assegna priorità e non indica una partita preferita.</p></div></section>
      </>}
      {screen === 'agenda' && <section className="page"><p className="eyebrow">Agenda settimanale</p><h2>Tutti e tre i calendari</h2><p className="page-intro">Le gare sono presentate senza graduatorie o suggerimenti. I risultati ufficiali FIPAV di Matese vengono aggiornati automaticamente.</p><div className="compare-legend"><span><i className="legend-home" />In casa</span><span><i className="legend-away" />Trasferta</span></div><div className="agenda-list">{weekends.map((weekend) => <section className="week-card compare-week" key={weekend.key}><div className="week-heading"><div><strong>Settimana del {dateLabel(weekend.key)}</strong><span>Partite in programma e risultati</span></div></div><div className="comparison-grid">{teams.map((team) => <ComparisonCell key={team.id} teamId={team.id} weekMatches={weekend.matches} results={results} />)}</div></section>)}</div></section>}
      {screen === 'teams' && <section className="page"><p className="eyebrow">Squadre</p><h2>Calendari 2026/27</h2><div className="filter-row"><button className={teamFilter === 'all' ? 'active' : ''} onClick={() => setTeamFilter('all')}>Tutte</button>{teams.map((team) => <button className={teamFilter === team.id ? 'active' : ''} onClick={() => setTeamFilter(team.id)} key={team.id}>{team.shortName}</button>)}</div>{teams.filter((team) => teamFilter === 'all' || team.id === teamFilter).map((team) => <section className="team-section" key={team.id}><div className="team-section-head"><span className="team-badge large" style={{ background: team.softColor, color: team.color }}>{team.code}</span><div><h3>{team.name}</h3><p>{team.championship}</p></div></div>{team.id === 'matese' && <div className="official-note"><strong>Risultati automatici</strong><span>Dati ufficiali FIPAV nazionale, aggiornati con la pubblicazione periodica dell’app.</span></div>}{team.status === 'pending' && <div className="pending-note"><strong>Area predisposta</strong><span>Il calendario ufficiale non è ancora disponibile. Sarà inserito senza modificare la logica dell’app.</span></div>}{matches.filter((match) => match.team === team.id).map((match) => <div className="dated-match" key={match.id}><time>{dateLabel(match.date)}</time><MatchRow match={match} result={match.matchNumber ? results[match.matchNumber] : undefined} /></div>)}</section>)}</section>}
      {screen === 'news' && <section className="page"><p className="eyebrow">News e aggiornamenti</p><h2>Le tre società</h2><p className="page-intro">Notizie dalle fonti ufficiali e giornalistiche. I pulsanti social aprono sempre il profilo originale.</p><AthleteFocus news={news} /><div className="filter-row"><button className={newsFilter === 'all' ? 'active' : ''} onClick={() => setNewsFilter('all')}>Tutte</button>{teams.map((team) => <button className={newsFilter === team.id ? 'active' : ''} onClick={() => setNewsFilter(team.id)} key={team.id}>{team.shortName}</button>)}</div><div className="source-grid">{teams.filter((team) => newsFilter === 'all' || newsFilter === team.id).map((team) => <article className="source-card" key={team.id}><div className="compare-team"><span className="team-dot" style={{ background: team.color }} /><strong>{team.shortName}</strong></div><div className="source-links">{Object.entries(sources[team.id]).map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer">{label === 'site' ? 'Sito ufficiale' : label[0].toUpperCase() + label.slice(1)}</a>)}</div></article>)}</div><div className="news-list">{news.filter((item) => newsFilter === 'all' || item.team === newsFilter).map((item) => <NewsCard item={item} key={item.id} />)}{news.length === 0 && <div className="pending-note"><strong>Aggiornamenti in preparazione</strong><span>I collegamenti ai profili ufficiali sono già disponibili.</span></div>}</div></section>}
      {screen === 'rules' && <section className="page"><p className="eyebrow">Regole</p><h2>Consultazione neutrale</h2><div className="rules-list"><article><span className="neutral">▦</span><div><h3>Tutte le partite sono equivalenti</h3><p>Nessuna squadra e nessuna gara ricevono una priorità automatica.</p></div></article><article><span className="neutral">⌂</span><div><h3>Casa e trasferta</h3><p>L’app distingue soltanto il luogo della gara, lasciando la scelta alla famiglia.</p></div></article></div><div className="info-card"><strong>Dati separati</strong><p>Volley Family è un’app sportiva autonoma. Non condivide dati o funzioni con applicazioni cliniche o gestionali.</p></div></section>}
    </main>
    <nav className="bottom-nav" aria-label="Navigazione principale">{nav.map((item) => <button key={item.id} className={screen === item.id ? 'active' : ''} onClick={() => setScreen(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav>
  </div>
}
export default App
