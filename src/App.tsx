import { useMemo, useState } from 'react'
import './App.css'
import { chooseHomeMatch, groupByWeekend } from './lib/decision.mjs'
import { matches, teams, type Match, type TeamId } from './data/schedule'

type Screen = 'home' | 'agenda' | 'teams' | 'rules'
const nav: { id: Screen; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '⌂' }, { id: 'agenda', label: 'Confronto', icon: '▦' },
  { id: 'teams', label: 'Squadre', icon: '●' }, { id: 'rules', label: 'Regole', icon: '✓' },
]
const longDate = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
const dateLabel = (value: string) => longDate.format(new Date(`${value}T12:00:00`))

function MatchRow({ match, chosen = false }: { match: Match; chosen?: boolean }) {
  const team = teams.find((item) => item.id === match.team)!
  return <article className={`match-row ${chosen ? 'chosen' : ''}`}>
    <span className="team-dot" style={{ background: team.color }} />
    <div className="match-copy"><strong>{team.shortName} · {match.home ? 'Casa' : 'Trasferta'}</strong><span>{match.home ? `${team.shortName} – ${match.opponent}` : `${match.opponent} – ${team.shortName}`}</span></div>
    <div className="match-meta"><strong>{match.time ?? 'Orario da definire'}</strong><span>{match.competition}</span></div>
  </article>
}

function ComparisonCell({ teamId, weekMatches, choice }: { teamId: TeamId; weekMatches: Match[]; choice: Match | null }) {
  const team = teams.find((item) => item.id === teamId)!
  const teamMatches = weekMatches.filter((match) => match.team === teamId)
  return <div className="compare-column">
    <div className="compare-team"><span className="team-dot" style={{ background: team.color }} /><strong>{team.shortName}</strong></div>
    {teamMatches.length ? teamMatches.map((match) => <div className={`compare-match ${match.home ? 'home' : 'away'} ${choice?.id === match.id ? 'selected' : ''}`} key={match.id}>
      <span className="where">{match.home ? 'IN CASA' : 'TRASFERTA'}</span>
      <strong>{match.opponent}</strong>
      <small>{dateLabel(match.date)} · {match.time ?? 'orario da definire'}</small>
    </div>) : <div className="compare-empty">{team.status === 'pending' ? 'Calendario in attesa' : 'Non gioca'}</div>}
  </div>
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [teamFilter, setTeamFilter] = useState<TeamId | 'all'>('all')
  const weekends = useMemo(() => groupByWeekend(matches), [])
  const firstChoice = weekends.map((weekend) => ({ ...weekend, choice: chooseHomeMatch(weekend.matches) })).find((weekend) => weekend.choice)
  const nextChoice = firstChoice?.choice
  return <div className="app-shell">
    <header className="topbar"><div><p className="eyebrow">Stagione 2026/27</p><h1>Volley Family</h1></div><div className="app-mark">VF</div></header>
    <main className="content">
      {screen === 'home' && <>
        <section className="hero-card"><p className="eyebrow light">Prossima scelta</p>{nextChoice ? <><span className="hero-date">{dateLabel(nextChoice.date)}</span><h2>Vai a {teams.find((team) => team.id === nextChoice.team)?.shortName}</h2><p>{nextChoice.opponent} · gara casalinga</p><button onClick={() => setScreen('agenda')}>Apri il confronto</button></> : <><h2>Calendari in aggiornamento</h2><p>La prossima gara casalinga apparirà qui.</p></>}</section>
        <section className="section-block"><div className="section-title"><div><p className="eyebrow">Le tue squadre</p><h2>Tre campionati, una scelta</h2></div><button className="text-button" onClick={() => setScreen('teams')}>Vedi tutte</button></div>
          <div className="team-grid">{teams.map((team) => <button className="team-card" key={team.id} onClick={() => { setTeamFilter(team.id); setScreen('teams') }}><span className="team-number" style={{ color: team.color }}>0{team.priority}</span><span className="team-badge" style={{ background: team.softColor, color: team.color }}>{team.code}</span><strong>{team.shortName}</strong><small>{team.championship}</small></button>)}</div>
        </section>
        <section className="rule-summary"><span className="check">✓</span><div><p className="eyebrow">Scelta automatica</p><h2>Solo gare in casa</h2><p>Altino ha priorità, poi ASD Matese e infine Perugia.</p></div></section>
      </>}
      {screen === 'agenda' && <section className="page"><p className="eyebrow">Confronto settimanale</p><h2>Tutti e tre i calendari</h2><p className="page-intro">Tutte le gare restano visibili per permetterti di valutarle. Quella consigliata è evidenziata in verde; se più squadre giocano in casa, Altino ha la precedenza.</p><div className="compare-legend"><span><i className="legend-green" />Consigliata</span><span><i className="legend-home" />In casa</span><span><i className="legend-away" />Trasferta</span></div><div className="agenda-list">{weekends.map((weekend) => { const choice = chooseHomeMatch(weekend.matches); return <section className="week-card compare-week" key={weekend.key}><div className="week-heading"><div><strong>Settimana del {dateLabel(weekend.key)}</strong><span>Confronto casa e trasferta</span></div><span className={`choice-pill ${choice ? '' : 'free'}`}>{choice ? `CONSIGLIATA: ${teams.find((t) => t.id === choice.team)?.shortName.toUpperCase()}` : 'NESSUNA GARA IN CASA'}</span></div><div className="comparison-grid">{teams.map((team) => <ComparisonCell key={team.id} teamId={team.id} weekMatches={weekend.matches} choice={choice} />)}</div></section> })}</div></section>}
      {screen === 'teams' && <section className="page"><p className="eyebrow">Squadre</p><h2>Calendari 2026/27</h2><div className="filter-row"><button className={teamFilter === 'all' ? 'active' : ''} onClick={() => setTeamFilter('all')}>Tutte</button>{teams.map((team) => <button className={teamFilter === team.id ? 'active' : ''} onClick={() => setTeamFilter(team.id)} key={team.id}>{team.shortName}</button>)}</div>{teams.filter((team) => teamFilter === 'all' || team.id === teamFilter).map((team) => <section className="team-section" key={team.id}><div className="team-section-head"><span className="team-badge large" style={{ background: team.softColor, color: team.color }}>{team.code}</span><div><h3>{team.name}</h3><p>{team.championship}</p></div></div>{team.status === 'pending' && <div className="pending-note"><strong>Area predisposta</strong><span>Il calendario ufficiale non è ancora disponibile. Sarà inserito senza modificare la logica dell’app.</span></div>}{matches.filter((match) => match.team === team.id).map((match) => <div className="dated-match" key={match.id}><time>{dateLabel(match.date)}</time><MatchRow match={match} /></div>)}</section>)}</section>}
      {screen === 'rules' && <section className="page"><p className="eyebrow">Regole</p><h2>Come viene scelta la partita</h2><div className="rules-list">{teams.map((team) => <article key={team.id}><span style={{ background: team.color }}>{team.priority}</span><div><h3>{team.shortName} in casa</h3><p>{team.priority === 1 ? 'Priorità assoluta.' : 'Scelta se le squadre con priorità superiore non giocano in casa.'}</p></div></article>)}<article><span className="neutral">–</span><div><h3>Weekend libero</h3><p>Quando tutte le squadre giocano in trasferta o non giocano.</p></div></article></div><div className="info-card"><strong>Dati separati</strong><p>Volley Family è un’app sportiva autonoma. Non condivide dati o funzioni con applicazioni cliniche o gestionali.</p></div></section>}
    </main>
    <nav className="bottom-nav" aria-label="Navigazione principale">{nav.map((item) => <button key={item.id} className={screen === item.id ? 'active' : ''} onClick={() => setScreen(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav>
  </div>
}
export default App
