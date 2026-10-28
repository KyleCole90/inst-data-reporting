import { useEffect, useState, type ReactNode } from 'react'
import './shell.css'

export interface ShellReport {
  id: string
  label: string
  /** Small red tag beside the tab label. */
  tag?: string
  tagTitle?: string
}

type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* storage unavailable */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Hash route for a set of report ids. Falls back to the first id. */
export function useHashRoute<T extends string>(ids: readonly T[]): T {
  const read = () => {
    const h = window.location.hash.replace('#', '').split('?')[0]
    return (ids as readonly string[]).includes(h) ? (h as T) : ids[0]
  }
  const [active, setActive] = useState<T>(read)
  useEffect(() => {
    const onHash = () => setActive(read())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  })
  return active
}

export function ReportShell({ product, title, subtitle, reports, active, footer, children }: {
  /** Eyebrow above the title: the product the reports belong to. */
  product: string
  title: string
  subtitle: string
  reports: readonly ShellReport[]
  active: string
  footer: string
  children: ReactNode
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme', theme) } catch { /* storage unavailable */ }
  }, [theme])

  return (
    <div className="rs-root">
      <div className="rs-notice no-print" role="note">
        <b>Sample data</b>Every name and number here is invented. Not a shipping feature.
      </div>

      <header className="rs-header no-print">
        <div className="rs-wrap">
          <div className="rs-top">
            <div>
              <a href={import.meta.env.BASE_URL} className="rs-back">&larr; All dashboards</a>
              <div className="rs-eyebrow">{product}</div>
              <div className="rs-title">{title}</div>
              <div className="rs-sub">{subtitle}</div>
            </div>
            <button className="rs-theme" aria-label="Toggle color theme" onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}>
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
          </div>
          <nav className="rs-tabs" aria-label="Reports">
            {reports.map((r) => (
              <a key={r.id} href={`#${r.id}`} className="rs-tab" aria-current={r.id === active ? 'page' : undefined}>
                {r.label}
                {r.tag && <span className="rs-tag" title={r.tagTitle}>{r.tag}</span>}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="rs-main">
        <div className="rs-wrap">{children}</div>
      </main>

      <footer className="rs-footer no-print">
        <div className="rs-wrap">{footer}</div>
      </footer>
    </div>
  )
}

export function ReportHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="rs-heading">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}
