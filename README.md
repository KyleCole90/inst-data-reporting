# Instructure data reporting: sample dashboards.

A landing page for demo dashboards built on synthetic data. **Every name and number on this site is invented.** No real institution, teacher, or student appears anywhere.

Live: https://kylecole90.github.io/inst-data-reporting/

## Dashboards.

| Dashboard | Path | Status |
|---|---|---|
| Mastery reports (four reports on the MasteryConnect REST API v2) | `/mastery/` | Live |
| Canvas reports | none yet | Placeholders on the landing page |

The landing page reads its list from `src/data/dashboards.ts`. Add a dashboard by adding an entry there.

## Layout.

- `index.html`, `src/App.tsx`: the landing page, built with shadcn/ui and Tailwind.
- `mastery/index.html`, `src/mastery/`: the Mastery reports, moved in from [mc-reports](https://github.com/KyleCole90/mc-reports). They use their own CSS (`src/mastery/theme.css`), not Tailwind. Each dashboard is a separate Vite entry, so styles don't leak between them.

## Run it locally.

```
npm install
npm run dev
```

Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`.
