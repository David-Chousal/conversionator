# COR web

Next.js 16 front end for COR. Visual language and component specs live in the design system (`../design-system/project`, published as the COR Design System artifact).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm test` | Unit tests (Vitest + Testing Library) |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run tokens` | Regenerate `src/styles/tokens.css` from the design system's `tokens.json` |

## Layout

- `src/app/(app)/` — signed-in pages inside the shell (Analytics, Connections, Data, Reports, Team, Settings).
- `src/app/(auth)/login/` — sign-in.
- `src/components/` — React components that render the design system's `cor-` markup.
- `src/styles/` — generated tokens, base styles, and one CSS file per design-system component, imported in order by `src/styles/index.ts`.
- `src/lib/data/` — the data contract (`types.ts`), sync health logic, and the mock Northwind data source. Pages import only from `@/lib/data`; swap `dataSource` in `index.ts` for the real API client.

## Conventions

- Never edit `tokens.css` by hand: change `tokens.json` in the design system and run `npm run tokens`.
- Anything that depends on the clock or the request goes through a request-time loader (see `lib/data/snapshot.ts`) and renders inside `<Suspense>`; Cache Components is on.
