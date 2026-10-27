import { useState, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

/* ---------- Method: how a number is calculated, and which DAP tables feed it ---------- */

export interface Method {
  /** Plain-language steps, one per line. */
  steps: string[]
  /** Canvas Data 2 tables and columns that feed the number. */
  tables: string[]
  /** Set when the sample fixture takes a shortcut a live build would not. */
  sample?: string
}

const SECTION = 'mb-1 text-[10.5px] tracking-wide text-[var(--text-muted)] uppercase'

export function MethodPopover({ method, title }: { method: Method; title: string }) {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        aria-label={`How ${title} is calculated`}
        className="no-print inline-flex shrink-0 cursor-help items-center gap-1 rounded-[3px] border px-1.5 py-0.5 text-[9.5px] leading-snug font-semibold tracking-wide text-[var(--text-muted)] uppercase hover:text-foreground data-popup-open:text-foreground"
      >
        <Info aria-hidden className="size-2.5" />
        Method
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[340px] gap-0 text-xs leading-normal">
        <div className="mb-1.5 font-semibold">{title}</div>
        <div className={SECTION}>Calculation</div>
        <ol className="mb-2.5 list-decimal pl-4 text-muted-foreground">
          {method.steps.map((s, i) => <li key={i} className="mb-0.5">{s}</li>)}
        </ol>
        <div className={SECTION}>Canvas Data 2 tables</div>
        <ul className="mb-0 font-mono text-[11px] text-muted-foreground">
          {method.tables.map((t) => <li key={t}>{t}</li>)}
        </ul>
        {method.sample && (
          <>
            <div className={cn(SECTION, 'mt-2.5')}>Sample data</div>
            <p className="text-muted-foreground">{method.sample}</p>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

/* ---------- Stat tile ---------- */

export function StatTile({ label, value, note, method }: { label: string; value: ReactNode; note?: string; method?: Method }) {
  return (
    <Card size="sm" className="gap-1 px-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] tracking-wide text-[var(--text-muted)] uppercase">{label}</span>
        {method && <MethodPopover method={method} title={label} />}
      </div>
      <div className="text-[28px] leading-tight font-semibold tracking-tight tabular-nums">{value}</div>
      {note && <div className="text-xs text-muted-foreground">{note}</div>}
    </Card>
  )
}

/* ---------- Chart card with a chart or table view ---------- */

export function ChartCard({ title, description, method, legend, chart, table, className }: {
  title: string
  description?: string
  method: Method
  legend?: ReactNode
  chart?: ReactNode
  table: ReactNode
  className?: string
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const showChart = chart && view === 'chart'
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          {title}
          <MethodPopover method={method} title={title} />
        </CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
        {chart && (
          <CardAction>
            <ToggleGroup
              variant="outline"
              size="sm"
              spacing={0}
              value={[view]}
              onValueChange={(v) => v[0] && setView(v[0] as 'chart' | 'table')}
              aria-label={`${title} view`}
              className="no-print"
            >
              <ToggleGroupItem value="chart" className="px-2.5 text-xs">Chart</ToggleGroupItem>
              <ToggleGroupItem value="table" className="px-2.5 text-xs">Table</ToggleGroupItem>
            </ToggleGroup>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {showChart && legend}
        {showChart ? chart : table}
      </CardContent>
    </Card>
  )
}

/* ---------- Legend ---------- */

export function Legend({ items }: { items: { label: string; fill: string; glyph?: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-[11px] shrink-0 rounded-[3px] shadow-[inset_0_0_0_1px_var(--border)]" style={{ background: it.fill }} />
          {it.glyph && <span aria-hidden className="text-foreground">{it.glyph}</span>}
          {it.label}
        </span>
      ))}
    </div>
  )
}

/* ---------- Submission status: color, glyph, and label together ---------- */

export const STATUS = {
  on_time: { label: 'On time', fill: 'var(--status-good)', glyph: '✓' },
  late: { label: 'Late', fill: 'var(--status-warning)', glyph: '●' },
  missing: { label: 'Missing', fill: 'var(--status-critical)', glyph: '✕' },
} as const

/* ---------- Outcome rating bands (shared with the Mastery reports) ---------- */

export const BANDS = [
  { key: 'remediate', label: 'Remediate', fill: 'var(--band-remediate)', ink: 'var(--band-ink-remediate)' },
  { key: 'near', label: 'Near mastery', fill: 'var(--band-near)', ink: 'var(--band-ink-near)' },
  { key: 'mastery', label: 'Mastery', fill: 'var(--band-mastery)', ink: 'var(--band-ink-mastery)' },
  { key: 'exceeds', label: 'Exceeds', fill: 'var(--band-exceeds)', ink: 'var(--band-ink-exceeds)' },
] as const

/* ---------- Filters ---------- */

export function FilterSelect({ label, value, onChange, items }: {
  label: string
  value: string
  onChange: (v: string) => void
  items: { value: string; label: string }[]
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] tracking-wide text-[var(--text-muted)] uppercase">{label}</span>
      <Select items={items} value={value} onValueChange={(v) => v && onChange(v as string)}>
        <SelectTrigger className="min-w-44 bg-card" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((it) => <SelectItem key={it.value} value={it.value}>{it.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
  )
}

export function FilterRow({ children }: { children: ReactNode }) {
  return <div className="no-print flex flex-wrap items-end gap-3">{children}</div>
}

/* ---------- Small pieces ---------- */

export function Meter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-[var(--series-1)]" style={{ width: `${value}%` }} />
      </div>
      <span className="tabular-nums">{value}%</span>
    </div>
  )
}

export function Change({ value, unit = ' pts' }: { value: number; unit?: string }) {
  const glyph = value > 0 ? '▲' : value < 0 ? '▼' : '–'
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <span aria-hidden className="text-[0.7em]">{glyph}</span>
      {value > 0 ? '+' : ''}{value}{unit}
    </span>
  )
}

export function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function SourceNote({ children }: { children: ReactNode }) {
  return <p className="text-xs text-[var(--text-muted)]">{children}</p>
}

export const pct = (n: number) => `${n}%`
