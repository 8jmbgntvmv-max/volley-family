import './App.css'

type Team = {
  name: string
  championship: string
  priority: number
  className: string
}

const teams: Team[] = [
  {
    name: 'Altino Volley',
    championship: 'Serie A2 Femminile',
    priority: 1,
    className: 'altino',
  },
  {
    name: 'ASD Matese',
    championship: 'Serie B2 Femminile · Girone H',
    priority: 2,
    className: 'matese',
  },
  {
    name: 'Perugia',
    championship: 'SuperLega A1 Maschile',
    priority: 3,
    className: 'perugia',
  },
]

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <p className="app-label">LifeCommunity</p>
        <h1>Volley Family</h1>
        <p className="app-subtitle">Agenda condivisa · Stagione 2026/27</p>
      </header>

      <main>
        <section className="next-match-card">
          <p className="section-label">Questa settimana vai a</p>
          <div className="team-symbol">🏐</div>
          <h2>Altino Volley</h2>
          <p>Prossima partita casalinga da confermare</p>

          <button type="button">Apri agenda</button>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <p className="section-label">Le tue squadre</p>
              <h2>Campionati seguiti</h2>
            </div>
          </div>

          <div className="team-grid">
            {teams.map((team) => (
              <article className={`team-card ${team.className}`} key={team.name}>
                <span className="priority">Priorità {team.priority}</span>
                <h3>{team.name}</h3>
                <p>{team.championship}</p>
                <button type="button">Visualizza</button>
              </article>
            ))}
          </div>
        </section>

        <section className="rules-card">
          <div className="rules-icon">✓</div>
          <div>
            <p className="section-label">Regola automatica</p>
            <h2>Solo partite in casa</h2>
            <p>
              In caso di concomitanza: Altino, ASD Matese, Perugia.
            </p>
          </div>
        </section>
      </main>

      <nav className="bottom-nav" aria-label="Navigazione principale">
        <button type="button" className="active">
          <span>⌂</span>
          Home
        </button>
        <button type="button">
          <span>▦</span>
          Agenda
        </button>
        <button type="button">
          <span>🏐</span>
          Squadre
        </button>
        <button type="button">
          <span>⚙</span>
          Regole
        </button>
      </nav>
    </div>
  )
}

export default App