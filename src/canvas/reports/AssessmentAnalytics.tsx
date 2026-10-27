import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ACCOUNTS, TERMS } from '../data/fixtures'
import { AT_RISK_CUT, TOP_CUT, assessmentAnalytics, coursesFor } from '../data/queries'
import {
  ChartCard, FilterRow, FilterSelect, Legend, Meter, MethodPopover, STATUS, SectionTitle, SourceNote, StatTile, pct,
  type Method,
} from '../components'

const TERM_ITEMS = TERMS.map((t) => ({ value: t.id, label: t.name }))
const DEPT_ITEMS = [{ value: 'all', label: 'All departments' }, ...ACCOUNTS.map((a) => ({ value: a.id, label: a.name }))]

const SUBMISSION_TABLES = ['submissions.score', 'submissions.workflow_state', 'assignments.points_possible', 'courses.enrollment_term_id', 'courses.account_id']

const M = {
  students: {
    steps: ['Count distinct students with at least one graded submission in the selected courses.'],
    tables: ['submissions.user_id', 'submissions.workflow_state', 'enrollments.type'],
  },
  average: {
    steps: ['For each graded submission, divide score by the assignment’s points possible.', 'Average those percentages.'],
    tables: SUBMISSION_TABLES,
  },
  onTime: {
    steps: [
      'Missing: no submitted_at, or late_policy_status is missing.',
      'Late: submitted_at is after cached_due_date.',
      'On time: everything else. Divide on time by all expected submissions.',
    ],
    tables: ['submissions.submitted_at', 'submissions.cached_due_date', 'submissions.late_policy_status'],
    sample: 'Canvas only sets late_policy_status when a teacher marks it by hand, so late is derived from timestamps here, as a live build would.',
  },
  atRisk: {
    steps: [`Average each student’s graded submissions across the selected courses.`, `Count students whose average is below ${AT_RISK_CUT}%.`],
    tables: SUBMISSION_TABLES,
    sample: `The ${AT_RISK_CUT}% cut is a report setting, not a Canvas field. Change it to match your grading policy.`,
  },
  byCourse: {
    steps: ['Group graded submissions by course.', 'Average the score as a percentage of points possible.'],
    tables: SUBMISSION_TABLES,
  },
  grades: {
    steps: ['Convert each graded submission to a percentage.', 'Count submissions in each letter band.'],
    tables: SUBMISSION_TABLES,
    sample: 'Bands use a standard 90/80/70/60 scale. A live build could read the course grading standard instead.',
  },
  status: {
    steps: ['Classify every expected submission as on time, late, or missing.', 'Show each as a share of the course total. Sorted by missing, highest first.'],
    tables: ['submissions.submitted_at', 'submissions.cached_due_date', 'submissions.late_policy_status', 'submissions.course_id'],
  },
  trend: {
    steps: ['Group graded submissions by the week of the term they were due.', 'Average the score percentage for each week.'],
    tables: ['submissions.cached_due_date', 'enrollment_terms.start_at', ...SUBMISSION_TABLES.slice(0, 2)],
  },
  completion: {
    steps: ['For each assignment, divide submitted (on time or late) by expected submissions.', 'List the lowest first.'],
    tables: ['assignments.name', 'submissions.submitted_at', 'submissions.workflow_state'],
  },
  byType: {
    steps: ['Group graded submissions by assignment submission type.', 'Report the count, average, lowest, and highest score percentage.'],
    tables: ['assignments.submission_types', ...SUBMISSION_TABLES.slice(0, 3)],
    sample: 'Quizzes are online_quiz. Everything else counts as an assignment or project.',
  },
  students_: {
    steps: ['Average each student’s graded submissions in scope.', `At risk: below ${AT_RISK_CUT}%. Top performers: ${TOP_CUT}% or above.`, 'Missing counts expected submissions never turned in.'],
    tables: ['users.sortable_name', ...SUBMISSION_TABLES.slice(0, 3)],
  },
} satisfies Record<string, Method>

const avgConfig = { average: { label: 'Average', color: 'var(--series-1)' } } satisfies ChartConfig
const gradeConfig = { count: { label: 'Submissions', color: 'var(--series-1)' } } satisfies ChartConfig
const statusConfig = {
  on_time: { label: 'On time', color: STATUS.on_time.fill },
  late: { label: 'Late', color: STATUS.late.fill },
  missing: { label: 'Missing', color: STATUS.missing.fill },
} satisfies ChartConfig

export function AssessmentAnalytics() {
  const [term, setTerm] = useState('2')
  const [account, setAccount] = useState('all')
  const [course, setCourse] = useState('all')

  const courseItems = useMemo(
    () => [{ value: 'all', label: 'All courses' }, ...coursesFor(term, account).map((c) => ({ value: c.id, label: c.name }))],
    [term, account],
  )
  const d = useMemo(() => assessmentAnalytics({ term, account, course }), [term, account, course])
  const rowHeight = (n: number) => Math.max(120, n * 30 + 40)

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle
        title="Assessment analytics"
        description="How students are scoring on graded work, and where submissions are late or missing. Filter by term, department, and course."
      />

      <FilterRow>
        <FilterSelect label="Term" value={term} items={TERM_ITEMS} onChange={(v) => { setTerm(v); setCourse('all') }} />
        <FilterSelect label="Department" value={account} items={DEPT_ITEMS} onChange={(v) => { setAccount(v); setCourse('all') }} />
        <FilterSelect label="Course" value={course} items={courseItems} onChange={setCourse} />
      </FilterRow>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Students" value={d.kpis.students} note={`${d.kpis.submissions.toLocaleString()} expected submissions`} method={M.students} />
        <StatTile label="Average score" value={pct(d.kpis.average)} note="Across graded submissions" method={M.average} />
        <StatTile label="Submitted on time" value={pct(d.kpis.onTime)} note="Of expected submissions" method={M.onTime} />
        <StatTile label="Students at risk" value={d.kpis.atRisk} note={`Average below ${AT_RISK_CUT}%`} method={M.atRisk} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Average score by course"
          description="Highest first"
          method={M.byCourse}
          chart={
            <ChartContainer config={avgConfig} className="aspect-auto w-full" style={{ height: rowHeight(d.avgByCourse.length) }}>
              <BarChart data={d.avgByCourse} layout="vertical" margin={{ left: 4, right: 16 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={pct} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="course" width={170} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="average" fill="var(--color-average)" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ChartContainer>
          }
          table={
            <Table>
              <TableHeader><TableRow><TableHead>Course</TableHead><TableHead className="text-right">Average</TableHead></TableRow></TableHeader>
              <TableBody>
                {d.avgByCourse.map((r) => (
                  <TableRow key={r.course}><TableCell>{r.course}</TableCell><TableCell className="text-right tabular-nums">{pct(r.average)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          }
        />

        <ChartCard
          title="Grade distribution"
          description="Graded submissions by letter band"
          method={M.grades}
          chart={
            <ChartContainer config={gradeConfig} className="aspect-auto h-[260px] w-full">
              <BarChart data={d.gradeDist} margin={{ top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="band" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={(_, p) => p[0]?.payload.label} />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ChartContainer>
          }
          table={
            <Table>
              <TableHeader><TableRow><TableHead>Band</TableHead><TableHead className="text-right">Submissions</TableHead></TableRow></TableHeader>
              <TableBody>
                {d.gradeDist.map((r) => (
                  <TableRow key={r.band}><TableCell>{r.label}</TableCell><TableCell className="text-right tabular-nums">{r.count}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          }
        />
      </div>

      <ChartCard
        title="Submission status by course"
        description="Share of expected submissions. Most missing first."
        method={M.status}
        legend={<Legend items={Object.values(STATUS)} />}
        chart={
          <ChartContainer config={statusConfig} className="aspect-auto w-full" style={{ height: rowHeight(d.statusByCourse.length) }}>
            <BarChart data={d.statusByCourse} layout="vertical" margin={{ left: 4, right: 16 }} stackOffset="expand">
              <XAxis type="number" tickFormatter={(v) => `${Math.round(v * 100)}%`} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="course" width={170} tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="on_time" stackId="s" fill="var(--color-on_time)" stroke="var(--surface-1)" strokeWidth={2} barSize={16} radius={[4, 0, 0, 4]} />
              <Bar dataKey="late" stackId="s" fill="var(--color-late)" stroke="var(--surface-1)" strokeWidth={2} barSize={16} />
              <Bar dataKey="missing" stackId="s" fill="var(--color-missing)" stroke="var(--surface-1)" strokeWidth={2} barSize={16} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        }
        table={
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                {Object.values(STATUS).map((s) => <TableHead key={s.label} className="text-right">{s.glyph} {s.label}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.statusByCourse.map((r) => (
                <TableRow key={r.course}>
                  <TableCell>{r.course}</TableCell>
                  <TableCell className="text-right tabular-nums">{pct(r.on_time)}</TableCell>
                  <TableCell className="text-right tabular-nums">{pct(r.late)}</TableCell>
                  <TableCell className="text-right tabular-nums">{pct(r.missing)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Average score by due week"
          description="Week of the term each assignment was due"
          method={M.trend}
          chart={
            <ChartContainer config={avgConfig} className="aspect-auto h-[240px] w-full">
              <LineChart data={d.trend} margin={{ top: 8, right: 16 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="week" tickFormatter={(w) => `Wk ${w}`} tickLine={false} axisLine={false} />
                <YAxis domain={[50, 100]} ticks={[50, 60, 70, 80, 90, 100]} tickFormatter={pct} tickLine={false} axisLine={false} width={44} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, p) => `Week ${p[0]?.payload.week}`} />} />
                <Line dataKey="average" stroke="var(--color-average)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-average)', stroke: 'var(--surface-1)', strokeWidth: 2 }} />
              </LineChart>
            </ChartContainer>
          }
          table={
            <Table>
              <TableHeader><TableRow><TableHead>Week</TableHead><TableHead className="text-right">Submissions</TableHead><TableHead className="text-right">Average</TableHead></TableRow></TableHeader>
              <TableBody>
                {d.trend.map((r) => (
                  <TableRow key={r.week}>
                    <TableCell>Week {r.week}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.submissions}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(r.average)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          }
        />

        <ChartCard
          title="Scores by assignment type"
          method={M.byType}
          table={
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Submissions</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                  <TableHead className="text-right">Lowest</TableHead>
                  <TableHead className="text-right">Highest</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.byType.map((r) => (
                  <TableRow key={r.type}>
                    <TableCell>{r.type}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.submissions.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(r.average)}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(r.lowest)}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(r.highest)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          }
        />
      </div>

      <ChartCard
        title="Lowest completion assignments"
        description="Submitted on time or late, as a share of expected. Lowest 10."
        method={M.completion}
        table={
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead>Completion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.completion.slice(0, 10).map((r) => (
                <TableRow key={`${r.course}-${r.assignment}`}>
                  <TableCell>{r.assignment}</TableCell>
                  <TableCell className="text-muted-foreground">{r.course}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.expected}</TableCell>
                  <TableCell><Meter value={r.rate} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <StudentList title="Students at risk" description={`Average below ${AT_RISK_CUT}%. Lowest first.`} rows={d.atRiskStudents} />
        <StudentList title="Top performers" description={`Average ${TOP_CUT}% or above. Highest first.`} rows={d.topStudents} />
      </div>

      <SourceNote>
        Every student, course, and score above is invented. With real records, these tables hold student education records
        covered by FERPA, so limit access to staff with a legitimate educational interest.
      </SourceNote>
    </div>
  )
}

function StudentList({ title, description, rows }: {
  title: string
  description: string
  rows: { user_id: string; name: string; courses: number; average: number; missing: number }[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          {title}
          <span className="font-normal text-muted-foreground tabular-nums">{rows.length}</span>
          <MethodPopover method={M.students_} title={title} />
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-80 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">Courses</TableHead>
                <TableHead className="text-right">Missing</TableHead>
                <TableHead className="text-right">Average</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.user_id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.courses}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.missing}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{pct(r.average)}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">No students in this range.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
