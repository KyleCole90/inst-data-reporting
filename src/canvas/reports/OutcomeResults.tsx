import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ACCOUNTS, TERMS } from '../data/fixtures'
import { outcomeResults, ratingFor } from '../data/queries'
import {
  BANDS, Change, ChartCard, FilterRow, FilterSelect, Legend, MethodPopover, SectionTitle, SourceNote, StatTile, pct,
  type Method,
} from '../components'

const TERM_ITEMS = TERMS.map((t) => ({ value: t.id, label: t.name }))
const DEPT_ITEMS = [{ value: 'all', label: 'All departments' }, ...ACCOUNTS.map((a) => ({ value: a.id, label: a.name }))]
const [FALL, SPRING] = TERMS.map((t) => t.name)

const RESULT_TABLES = ['learning_outcome_results.score', 'learning_outcome_results.mastery', 'learning_outcome_results.learning_outcome_id', 'learning_outcomes.short_description']

const M = {
  outcomes: { steps: ['Count distinct outcomes with at least one result in scope.'], tables: ['learning_outcome_results.learning_outcome_id'] },
  average: { steps: ['Average every result score on the 1 to 4 rating scale.'], tables: RESULT_TABLES.slice(0, 1) },
  students: {
    steps: ['Average each student’s result scores in scope.', 'Count students whose average is 3 (Mastery) or higher.', 'Divide by all students with results.'],
    tables: ['learning_outcome_results.user_id', 'learning_outcome_results.score'],
  },
  improvement: { steps: [`Average score in ${SPRING} minus the average in ${FALL}, on the 1 to 4 scale.`], tables: ['learning_outcome_results.score', 'courses.enrollment_term_id'] },
  distribution: {
    steps: ['Group results by outcome.', 'Show the share at each rating: Exceeds 4, Mastery 3, Near mastery 2, Remediate 1.', 'Sorted by mastery rate, lowest first.'],
    tables: RESULT_TABLES,
    sample: 'Ratings match the four bands in the Mastery reports, so a 3 of 4 lines up with their 75% cut.',
  },
  trend: { steps: ['Mastery rate per outcome in each term.', 'Change is spring minus fall, in percentage points. Largest drop first.'], tables: [...RESULT_TABLES, 'courses.enrollment_term_id'] },
  students_: {
    steps: ['Average each student’s results per outcome.', 'Mastered: outcomes where that average is 3 or higher.', 'Rating: the band for the overall average, rounded down.'],
    tables: ['users.sortable_name', 'learning_outcome_results.user_id', 'learning_outcome_results.score'],
  },
} satisfies Record<string, Method>

const config = Object.fromEntries(BANDS.map((b) => [b.key, { label: b.label, color: b.fill }])) satisfies ChartConfig

export function OutcomeResults() {
  const [term, setTerm] = useState('2')
  const [account, setAccount] = useState('all')
  const [query, setQuery] = useState('')
  const d = useMemo(() => outcomeResults({ term, account }), [term, account])

  const needle = query.trim().toLowerCase()
  const students = needle ? d.students.filter((s) => s.name.toLowerCase().includes(needle)) : d.students

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle
        title="Outcome results"
        description="How students rate on each learning outcome, and which outcomes gained or lost ground between terms."
      />

      <FilterRow>
        <FilterSelect label="Term" value={term} items={TERM_ITEMS} onChange={setTerm} />
        <FilterSelect label="Department" value={account} items={DEPT_ITEMS} onChange={setAccount} />
      </FilterRow>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Outcomes assessed" value={d.kpis.outcomes} note={`${d.kpis.results.toLocaleString()} results`} method={M.outcomes} />
        <StatTile label="Average score" value={<>{d.kpis.averageScore}<span className="text-base font-normal text-muted-foreground"> / 4</span></>} note="Rating scale" method={M.average} />
        <StatTile label="Students at mastery" value={pct(d.kpis.studentsAtMastery)} note="Average of 3 or higher" method={M.students} />
        <StatTile label="Change since fall" value={<Change value={d.kpis.improvement} unit="" />} note="Average score, both terms" method={M.improvement} />
      </div>

      <ChartCard
        title="Rating distribution by outcome"
        description="Share of results at each rating. Lowest mastery rate first."
        method={M.distribution}
        legend={<Legend items={[...BANDS]} />}
        chart={
          <ChartContainer config={config} className="aspect-auto w-full" style={{ height: Math.max(140, d.distribution.length * 32 + 40) }}>
            <BarChart data={d.distribution} layout="vertical" stackOffset="expand" margin={{ left: 4, right: 16 }}>
              <XAxis type="number" tickFormatter={(v) => `${Math.round(v * 100)}%`} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="outcome" width={170} tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              {BANDS.map((b, i) => (
                <Bar
                  key={b.key}
                  dataKey={b.key}
                  stackId="r"
                  fill={`var(--color-${b.key})`}
                  stroke="var(--surface-1)"
                  strokeWidth={2}
                  barSize={18}
                  radius={i === 0 ? [4, 0, 0, 4] : i === BANDS.length - 1 ? [0, 4, 4, 0] : 0}
                />
              ))}
            </BarChart>
          </ChartContainer>
        }
        table={
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Outcome</TableHead>
                <TableHead>Department</TableHead>
                {BANDS.map((b) => <TableHead key={b.key} className="text-right">{b.label}</TableHead>)}
                <TableHead className="text-right">At mastery</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.distribution.map((r) => (
                <TableRow key={r.outcome}>
                  <TableCell>{r.outcome}</TableCell>
                  <TableCell className="text-muted-foreground">{r.department}</TableCell>
                  {BANDS.map((b) => <TableCell key={b.key} className="text-right tabular-nums">{pct(r[b.key])}</TableCell>)}
                  <TableCell className="text-right font-medium tabular-nums">{pct(r.rate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      />

      <ChartCard
        title={`Mastery rate, ${FALL} to ${SPRING}`}
        description="Largest drop first"
        method={M.trend}
        table={
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Outcome</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">{FALL}</TableHead>
                <TableHead className="text-right">{SPRING}</TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.trend.map((r) => (
                <TableRow key={r.outcome}>
                  <TableCell>{r.outcome}</TableCell>
                  <TableCell className="text-muted-foreground">{r.department}</TableCell>
                  <TableCell className="text-right tabular-nums">{pct(r.fall)}</TableCell>
                  <TableCell className="text-right tabular-nums">{pct(r.spring)}</TableCell>
                  <TableCell className="text-right"><Change value={r.change} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            Student results
            <span className="font-normal text-muted-foreground tabular-nums">{students.length}</span>
            <MethodPopover method={M.students_} title="Student results" />
          </CardTitle>
          <CardDescription className="text-xs">Lowest average first</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search students" aria-label="Search students" className="bg-card pl-8" />
          </div>
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Outcomes</TableHead>
                  <TableHead className="text-right">Mastered</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => {
                  const band = BANDS.find((b) => b.key === ratingFor(s.average).key)!
                  return (
                    <TableRow key={s.user_id}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.outcomes}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.mastered}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.average.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className="inline-block rounded px-1.5 py-0.5 text-[11px] font-medium" style={{ background: band.fill, color: band.ink }}>
                          {band.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {students.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">No students match “{query}”.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SourceNote>
        Every student and result above is invented. Real outcome results are student education records under FERPA.
      </SourceNote>
    </div>
  )
}
