import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TERMS } from '../data/fixtures'
import { programAssessment } from '../data/queries'
import { Change, ChartCard, Legend, SectionTitle, SourceNote, StatTile, pct, type Method } from '../components'

const [FALL, SPRING] = TERMS.map((t) => t.name)

const MASTERY_STEPS = [
  'Take every learning outcome result in the department’s courses.',
  'A result is at mastery when its score meets the outcome’s mastery points (3 of 4).',
  'Divide results at mastery by all results.',
]
const OUTCOME_TABLES = ['learning_outcome_results.mastery', 'learning_outcome_results.context_id', 'courses.account_id', 'courses.enrollment_term_id']

const M = {
  departments: { steps: ['Count sub-accounts under the institution that own learning outcomes.'], tables: ['accounts.parent_account_id', 'learning_outcomes.context_id'] },
  alignments: {
    steps: ['Count outcome alignments on published assignments.', 'One alignment per outcome per assignment.'],
    tables: ['content_tags.learning_outcome_id', 'content_tags.content_id', 'assignments.workflow_state'],
    sample: 'Two assessments per course (midterm and final project) carry the department’s two outcomes.',
  },
  mastery: { steps: [...MASTERY_STEPS.slice(0, 2), `Divide ${SPRING} results at mastery by all ${SPRING} results.`], tables: OUTCOME_TABLES },
  growth: { steps: [`Mastery rate in ${SPRING} minus the rate in ${FALL}, in percentage points.`], tables: OUTCOME_TABLES },
  byDept: { steps: [...MASTERY_STEPS, 'Repeat for each term.'], tables: OUTCOME_TABLES },
  coverage: {
    steps: ['Outcomes: owned by the department account.', 'Courses: the department’s courses this term.', 'Alignments and results: summed across both terms.', 'Change: mastery rate this term minus last term.'],
    tables: ['learning_outcomes.context_id', 'content_tags.learning_outcome_id', 'learning_outcome_results.id', 'courses.account_id'],
  },
  byTerm: {
    steps: ['Students: distinct users with at least one outcome result.', 'Average score: mean of result scores on the 1 to 4 scale.', 'Mastery: results at mastery over all results.'],
    tables: ['learning_outcome_results.user_id', 'learning_outcome_results.score', 'learning_outcome_results.mastery'],
  },
} satisfies Record<string, Method>

const config = {
  fall: { label: FALL, color: 'var(--series-1)' },
  spring: { label: SPRING, color: 'var(--series-2)' },
} satisfies ChartConfig

export function ProgramAssessment() {
  const d = useMemo(programAssessment, [])

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle
        title="Program assessment"
        description={`Which departments are moving students toward mastery of their learning outcomes, comparing ${FALL} with ${SPRING}.`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Departments" value={d.kpis.departments} note={`${d.kpis.assessments} aligned assessments`} method={M.departments} />
        <StatTile label="Outcome alignments" value={d.kpis.alignments} note="Across both terms" method={M.alignments} />
        <StatTile label={`Mastery, ${SPRING}`} value={pct(d.kpis.mastery)} note="Of outcome results" method={M.mastery} />
        <StatTile label="Change since fall" value={<Change value={d.kpis.growth} />} note="Mastery rate" method={M.growth} />
      </div>

      <ChartCard
        title="Mastery rate by department"
        description="Share of outcome results at mastery, by term"
        method={M.byDept}
        legend={<Legend items={[{ label: FALL, fill: 'var(--series-1)' }, { label: SPRING, fill: 'var(--series-2)' }]} />}
        chart={
          <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
            <BarChart data={d.byDepartment} margin={{ top: 8 }} barGap={2}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="department" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tickFormatter={pct} tickLine={false} axisLine={false} width={44} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="fall" fill="var(--color-fall)" radius={[4, 4, 0, 0]} barSize={26} />
              <Bar dataKey="spring" fill="var(--color-spring)" radius={[4, 4, 0, 0]} barSize={26} />
            </BarChart>
          </ChartContainer>
        }
        table={<DepartmentTable rows={d.byDepartment} />}
      />

      <ChartCard title="Outcome coverage by department" method={M.coverage} table={<DepartmentTable rows={d.byDepartment} coverage />} />

      <ChartCard
        title="Term comparison"
        method={M.byTerm}
        table={
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term</TableHead>
                <TableHead className="text-right">Students assessed</TableHead>
                <TableHead className="text-right">Results</TableHead>
                <TableHead className="text-right">Average score</TableHead>
                <TableHead className="text-right">Mastery</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.byTerm.map((r) => (
                <TableRow key={r.term}>
                  <TableCell>{r.term}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.students}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.results.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.averageScore} / 4</TableCell>
                  <TableCell className="text-right tabular-nums">{pct(r.mastery)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      />

      <SourceNote>Every department, outcome, and result above is invented.</SourceNote>
    </div>
  )
}

function DepartmentTable({ rows, coverage }: { rows: ReturnType<typeof programAssessment>['byDepartment']; coverage?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Department</TableHead>
          {coverage && (
            <>
              <TableHead className="text-right">Outcomes</TableHead>
              <TableHead className="text-right">Courses</TableHead>
              <TableHead className="text-right">Alignments</TableHead>
              <TableHead className="text-right">Results</TableHead>
            </>
          )}
          <TableHead className="text-right">{FALL}</TableHead>
          <TableHead className="text-right">{SPRING}</TableHead>
          <TableHead className="text-right">Change</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.department}>
            <TableCell>{r.department}</TableCell>
            {coverage && (
              <>
                <TableCell className="text-right tabular-nums">{r.outcomes}</TableCell>
                <TableCell className="text-right tabular-nums">{r.courses}</TableCell>
                <TableCell className="text-right tabular-nums">{r.alignments}</TableCell>
                <TableCell className="text-right tabular-nums">{r.results.toLocaleString()}</TableCell>
              </>
            )}
            <TableCell className="text-right tabular-nums">{pct(r.fall)}</TableCell>
            <TableCell className="text-right tabular-nums">{pct(r.spring)}</TableCell>
            <TableCell className="text-right"><Change value={r.change} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
