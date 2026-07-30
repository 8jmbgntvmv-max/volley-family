import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { groupByWeekend } from './lib/decision.mjs'
import { matches, teams, type Match, type TeamId } from './data/schedule'

type Screen = 'home' | 'agenda' | 'teams' | 'news' | 'rules'
type NewsItem = { id: string; team: TeamId; title: string; url: string; source: string; publishedAt: string; image?: string }
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
const longDate = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
const dateLabel = (value: string) => longDate.format(new Date(`${value}T12:00:00`))

function MatchRow({ match }: { match: Match }) {
  const team = teams.find((item) => item.id === match.team)!
  return <article className="match-row">
    <span className="team-dot" style={{ background: team.color }} />
    <div className="match-copy"><strong>{team.shortName} · {match.home ? 'Casa' : 'Trasferta'}</strong><span>{match.home ? `${team.shortName} – ${match.opponent}` : `${match.opponent} – ${team.shortName}`}</span></div>
    <div className="match-meta"><strong>{match.time ?? 'Orario da definire'}</strong><span>{match.venue ?? match.competition}{match.matchNumber ? ` · gara ${match.matchNumber}` : ''}</span></div>
  </article>
}

function ComparisonCell({ teamId, weekMatches }: { teamId: TeamId; weekMatches: Match[] }) {
  const team = teams.find((item) => item.id === teamId)!
  const teamMatches = weekMatches.filter((match) => match.team === teamId)
  return <div className="compare-column">
    <div className="compare-team"><span className="team-dot" style={{ background: team.color }} /><strong>{team.shortName}</strong></div>
    {teamMatches.length ? teamMatches.map((match) => <div className={`compare-match ${match.home ? 'home' : 'away'}`} key={match.id}>
      <span className="where">{match.home ? 'IN CASA' : 'TRASFERTA'}</span>
      <strong>{match.opponent}</strong>
      <small>{dateLabel(match.date)} · {match.time ?? 'orario da definire'}{match.venue ? ` · ${match.venue}` : ''}</small>
    </div>) : <div className="compare-empty">{team.status === 'pending' ? 'Calendario in attesa' : 'Non gioca'}</div>}
  </div>
}

function NewsCard({ item }: { item: NewsItem }) {
  const team = teams.find((candidate) => candidate.id === item.team)!
  return <a className="news-card" href={item.url} target="_blank" rel="noreferrer">
    <div className="news-preview" style={{ background: `linear-gradient(145deg, ${team.color}, ${team.softColor})` }}><span>{team.code}</span>{item.image && <img src={item.image} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} />}</div>
    <div className="news-card-copy"><span className="news-source"><i style={{ background: team.color }} />{team.shortName} · {item.source}</span><strong>{item.title}</strong><time>{dateLabel(item.publishedAt.slice(0, 10))}</time></div>
  </a>
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [teamFilter, setTeamFilter] = useState<TeamId | 'all'>('all')
  const [newsFilter, setNewsFilter] = useState<TeamId | 'all'>('all')
  const [news, setNews] = useState<NewsItem[]>([])
  const weekends = useMemo(() => groupByWeekend(matches), [])
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}news.json`).then((response) => response.json()).then((data) => setNews(data.items ?? [])).catch(() => setNews([]))
  }, [])
  return <div className="app-shell">
    <header className="topbar"><div><p className="eyebrow">Stagione 2026/27</p><h1>Volley Family</h1></div><div className="app-mark">VF</div></header>
    <main className="content">
      {screen === 'home' && <>
        <section className="hero-card"><p className="eyebrow light">Agenda condivisa</p><h2>Tutte le partite, senza suggerimenti</h2><p>Consulta liberamente gare in casa e trasferte di Altino, Matese e Perugia.</p><button onClick={() => setScreen('agenda')}>Apri i calendari</button></section>
        <section className="section-block"><div className="section-title"><div><p className="eyebrow">Le tue squadre</p><h2>Tre campionati, un’unica agenda</h2></div><button className="text-button" onClick={() => setScreen('teams')}>Vedi tutte</button></div>
          <div className="team-grid">{teams.map((team) => <button className="team-card" key={team.id} onClick={() => { setTeamFilter(team.id); setScreen('teams') }}><span className="team-badge" style={{ background: team.softColor, color: team.color }}>{team.code}</span><strong>{team.shortName}</strong><small>{team.championship}</small></button>)}</div>
        </section>
        <section className="rule-summary"><span className="check">▦</span><div><p className="eyebrow">Calendario neutrale</p><h2>Decidi tu quale partita seguire</h2><p>L’app non assegna priorità e non indica una partita preferita.</p></div></section>
      </>}
      {screen === 'agenda' && <section className="page"><p className="eyebrow">Agenda settimanale</p><h2>Tutti e tre i calendari</h2><p className="page-intro">Le gare sono presentate senza graduatorie o suggerimenti. Casa e trasferta restano distinte per facilitare la consultazione.</p><div className="compare-legend"><span><i className="legend-home" />In casa</span><span><i className="legend-away" />Trasferta</span></div><div className="agenda-list">{weekends.map((weekend) => <section className="week-card compare-week" key={weekend.key}><div className="week-heading"><div><strong>Settimana del {dateLabel(weekend.key)}</strong><span>Partite in programma</span></div></div><div className="comparison-grid">{teams.map((team) => <ComparisonCell key={team.id} teamId={team.id} weekMatches={weekend.matches} />)}</div></section>)}</div></section>}
      {screen === 'teams' && <section className="page"><p className="eyebrow">Squadre</p><h2>Calendari 2026/27</h2><div className="filter-row"><button className={teamFilter === 'all' ? 'active' : ''} onClick={() => setTeamFilter('all')}>Tutte</button>{teams.map((team) => <button className={teamFilter === team.id ? 'active' : ''} onClick={() => setTeamFilter(team.id)} key={team.id}>{team.shortName}</button>)}</div>{teams.filter((team) => teamFilter === 'all' || team.id === teamFilter).map((team) => <section className="team-section" key={team.id}><div className="team-section-head"><span className="team-badge large" style={{ background: team.softColor, color: team.color }}>{team.code}</span><div><h3>{team.name}</h3><p>{team.championship}</p></div></div>{team.status === 'pending' && <div className="pending-note"><strong>Area predisposta</strong><span>Il calendario ufficiale non è ancora disponibile. Sarà inserito senza modificare la logica dell’app.</span></div>}{matches.filter((match) => match.team === team.id).map((match) => <div className="dated-match" key={match.id}><time>{dateLabel(match.date)}</time><MatchRow match={match} /></div>)}</section>)}</section>}
      {screen === 'news' && <section className="page"><p className="eyebrow">News e aggiornamenti</p><h2>Le tre società</h2><p className="page-intro">Notizie dalle fonti ufficiali e giornalistiche. I pulsanti social aprono sempre il profilo originale.</p><div className="filter-row"><button className={newsFilter === 'all' ? 'active' : ''} onClick={() => setNewsFilter('all')}>Tutte</button>{teams.map((team) => <button className={newsFilter === team.id ? 'active' : ''} onClick={() => setNewsFilter(team.id)} key={team.id}>{team.shortName}</button>)}</div><div className="source-grid">{teams.filter((team) => newsFilter === 'all' || newsFilter === team.id).map((team) => <article className="source-card" key={team.id}><div className="compare-team"><span className="team-dot" style={{ background: team.color }} /><strong>{team.shortName}</strong></div><div className="source-links">{Object.entries(sources[team.id]).map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer">{label === 'site' ? 'Sito ufficiale' : label[0].toUpperCase() + label.slice(1)}</a>)}</div></article>)}</div><div className="news-list">{news.filter((item) => newsFilter === 'all' || item.team === newsFilter).map((item) => <NewsCard item={item} key={item.id} />)}{news.length === 0 && <div className="pending-note"><strong>Aggiornamenti in preparazione</strong><span>I collegamenti ai profili ufficiali sono già disponibili.</span></div>}</div></section>}
      {screen === 'rules' && <section className="page"><p className="eyebrow">Regole</p><h2>Consultazione neutrale</h2><div className="rules-list"><article><span className="neutral">▦</span><div><h3>Tutte le partite sono equivalenti</h3><p>Nessuna squadra e nessuna gara ricevono una priorità automatica.</p></div></article><article><span className="neutral">⌂</span><div><h3>Casa e trasferta</h3><p>L’app distingue soltanto il luogo della gara, lasciando la scelta alla famiglia.</p></div></article></div><div className="info-card"><strong>Dati separati</strong><p>Volley Family è un’app sportiva autonoma. Non condivide dati o funzioni con applicazioni cliniche o gestionali.</p></div></section>}
    </main>
    <nav className="bottom-nav" aria-label="Navigazione principale">{nav.map((item) => <button key={item.id} className={screen === item.id ? 'active' : ''} onClick={() => setScreen(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav>
  </div>
}
export default App
