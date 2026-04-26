# custom-todo

Personal To-do app — macOS / iOS web (PWA), Things-style liquid glass aesthetic. Implemented from a Claude Design handoff.

## Stack

- **Vite + React 19 + TypeScript**
- **Supabase** for auth + sync (planned, P2)
- **PWA** for iOS install + offline cache (planned, P3)

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve production build locally
```

## Project layout

```
src/
  App.tsx              # state-owning root + view router
  main.tsx             # entry
  index.css            # design tokens + liquid glass primitives
  types.ts             # Task / Project / Group / View / NewTaskPayload
  components/          # Icon, Checkbox, TaskRow, GroupHeader, Sidebar, NewTaskModal
  views/               # TodayView, ProjectView, UpcomingView, ListView
  data/                # seed.ts (initial), helpers.ts (dayFromDue, computeCounts)
```

## Roadmap

- **P0 · Vite migration** — port the React UMD prototype into a real Vite + TS project (current)
- **P1 · Local persistence** — `useLocalStorage` so tasks survive a refresh
- **P2 · Supabase sync** — Postgres + magic-link auth + RLS, two-device sync
- **P3 · PWA + light offline** — install on iOS, last-seen data visible offline
- **P4 · Polish** — keyboard shortcuts, drag reorder, archive, etc.

## Design source

Originally designed in Claude Design (claude.ai/design); the working prototype lives at the [initial commit](https://github.com/tokki-inthespace/custom-todo/commit/75e6c4d) for reference.
