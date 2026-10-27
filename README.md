# Instructure data reporting: sample dashboards.

A landing page for demo dashboards built on synthetic data. **Every name and number on this site is invented.** No real institution, teacher, or student appears anywhere.

Live: https://kylecole90.github.io/inst-data-reporting/

## Dashboards.

| Dashboard | Path | Status |
|---|---|---|
| Mastery reports (four reports on the MasteryConnect REST API v2) | `/mastery/` | Live |
| Canvas assessment reports (assessment analytics, program assessment, outcome results on Canvas Data 2 tables) | `/canvas/` | Live |

The landing page reads its list from `src/data/dashboards.ts`. Add a dashboard by adding an entry there.

## Layout.

- `index.html`, `src/App.tsx`: the landing page, built with shadcn/ui and Tailwind.
- `mastery/index.html`, `src/mastery/`: the Mastery reports, moved in from [mc-reports](https://github.com/KyleCole90/mc-reports). They use their own CSS (`src/mastery/theme.css`), not Tailwind. Each dashboard is a separate Vite entry, so styles don't leak between them.
- `canvas/index.html`, `src/canvas/`: the Canvas reports, built with shadcn/ui and Recharts. Fixtures in `src/canvas/data/fixtures.ts` use Canvas Data 2 (DAP) table and column names. Course and department names are generic so the reports fit K12 and higher ed.
- `src/shared/`: design tokens (`tokens.css`) and the seeded random generator (`prng.ts`) both report apps use, so they share colors, the four mastery bands, and dark mode.

## Run it locally.

```
npm install
npm run dev
```

Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`.
