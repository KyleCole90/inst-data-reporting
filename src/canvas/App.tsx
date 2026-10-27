import { useEffect, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AssessmentAnalytics } from './reports/AssessmentAnalytics'
import { ProgramAssessment } from './reports/ProgramAssessment'
import { OutcomeResults } from './reports/OutcomeResults'
import { INSTITUTION } from './data/fixtures'

const REPORTS = [
  { id: 'assessment', label: 'Assessment analytics', Component: AssessmentAnalytics },
  { id: 'programs', label: 'Program assessment', Component: ProgramAssessment },
  { id: 'outcomes', label: 'Outcome results', Component: OutcomeResults },
] as const

type ReportId = (typeof REPORTS)[number]['id']

function readHash(): ReportId {
  const h = window.location.hash.replace('#', '').split('?')[0]
  return REPORTS.some((r) => r.id === h) ? (h as ReportId) : 'assessment'
}

type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* storage unavailable */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function App() {
  const [active, setActive] = useState<ReportId>(readHash)
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    const onHash = () => setActive(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme', theme) } catch { /* storage unavailable */ }
  }, [theme])

  return (
    <Tabs value={active} onValueChange={(v) => { window.location.hash = v as string }} className="min-h-screen gap-0">
      <div className="no-print flex items-center justify-center gap-2 bg-[var(--status-warning)] px-5 py-[7px] text-center text-[12.5px] font-medium text-[#0b0b0b]">
        <TriangleAlert aria-hidden className="size-3.5" />
        Sample data. Not a real institution. Every name and number here is invented.
      </div>

      <header className="no-print border-b bg-card px-5 pt-3.5">
        <div className="mx-auto max-w-[1240px]">
          <div className="flex flex-wrap items-baseline justify-between gap-5">
            <div>
              <a href={import.meta.env.BASE_URL} className="text-xs text-muted-foreground no-underline hover:text-foreground">
                &larr; All dashboards
              </a>
              <div className="text-[17px] font-semibold tracking-tight">Canvas assessment reports</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{INSTITUTION.name} · built on Canvas Data 2</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
              aria-label="Toggle color theme"
              className="bg-transparent text-xs text-muted-foreground"
            >
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </Button>
          </div>

          <TabsList variant="line" className="mt-3.5 h-auto gap-0.5 p-0">
            {REPORTS.map((r) => (
              <TabsTrigger
                key={r.id}
                value={r.id}
                className="flex-none rounded-none px-3 py-2.5 text-[13px] font-normal text-muted-foreground after:bottom-0 after:bg-[var(--series-1)] data-active:font-semibold data-active:text-foreground"
              >
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </header>

      <main className="flex-1 px-5 pt-6 pb-14">
        <div className="mx-auto max-w-[1240px]">
          {REPORTS.map((r) => (
            <TabsContent key={r.id} value={r.id}>
              <r.Component />
            </TabsContent>
          ))}
        </div>
      </main>

      <footer className="no-print border-t px-5 py-4 text-[11.5px] leading-relaxed text-[var(--text-muted)]">
        <div className="mx-auto max-w-[1240px]">
          Sample reports modeled on Canvas Data 2 (DAP) tables. Fixtures use real table and column names, so swapping
          them for a live query changes the rows, not the reports. No real student data appears anywhere in this site.
        </div>
      </footer>
    </Tabs>
  )
}
