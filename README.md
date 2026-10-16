# Volley Family

PWA familiare per seguire calendari, risultati, news e dirette di Altino, Matese e Perugia.

## Bacheca familiare

La bacheca usa l'accesso anonimo di Supabase: ogni telefono riceve un'identità tecnica e può leggere e scrivere nella bacheca condivisa scegliendo un nome visibile. Non è richiesto un codice, una password o un numero di telefono. **Chiunque abbia il link pubblico dell'app può accedere alla bacheca e vedere o pubblicare messaggi; condividi il link solo con chi vuoi ammettere.**

1. Crea un progetto Supabase e abilita `Authentication > Providers > Anonymous Sign-Ins`.
2. Per una nuova installazione, esegui `supabase/family-board.sql` nel SQL Editor.
3. Configura nel repository GitHub le variabili `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Avvia nuovamente il workflow `Pubblica Volley Family`.

Per convertire un'installazione esistente, esegui una volta `supabase/open-family-board-migration.sql` nel SQL Editor dopo la pubblicazione dell'app. Mantiene i messaggi già presenti e rimuove il codice necessario per entrare. La chiave anonima è pubblica per natura; le tabelle non sono accessibili direttamente dal browser e ciascuno può eliminare soltanto i propri messaggi.

## Pulsante Cerca ora

Il pulsante News può avviare davvero il workflow di ricerca, senza attendere la pianificazione di GitHub:

1. Crea su GitHub un token fine-grained limitato al repository `8jmbgntvmv-max/volley-family`, con il solo permesso repository `Actions: Read and write`.
2. In Supabase apri `Integrations > Vault`, crea un nuovo secret e usa il nome esatto `vf_github_actions_token`. Incolla il token soltanto nel campo protetto `Secret`, non nel SQL Editor o nel repository.
3. Nel SQL Editor esegui tutto il file `supabase/news-refresh.sql`.
4. Per avviare una scansione o segnalare un post, il telefono deve prima aver scelto un nome nella sezione Bacheca. Le richieste sono limitate a una scansione ogni tre minuti.

La stessa configurazione abilita “Segnala un annuncio social”: il collegamento Instagram o Facebook viene salvato, letto dal workflow e aggiunto alle News. Il token resta cifrato nel Vault Supabase e non viene inserito nell’app o nel repository.

## Sviluppo

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
