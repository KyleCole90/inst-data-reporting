import {
  ACCOUNTS, ASSIGNMENTS, COURSES, LEARNING_OUTCOMES, OUTCOME_ALIGNMENTS, OUTCOME_RESULTS, RATINGS, SUBMISSIONS, TERMS,
  MASTERY_POINTS, accountById, assignmentById, courseById, termById, userById,
  type OutcomeResult, type Submission,
} from './fixtures'

export const AT_RISK_CUT = 70
export const TOP_CUT = 85

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const round1 = (n: number) => Math.round(n * 10) / 10
const groupBy = <T,>(xs: T[], key: (x: T) => string) => {
  const m = new Map<string, T[]>()
  for (const x of xs) m.set(key(x), [...(m.get(key(x)) ?? []), x])
  return m
}

export type SubmissionStatus = 'on_time' | 'late' | 'missing'

/** Missing: never submitted. Late: submitted after `cached_due_date`. */
export function statusOf(s: Submission): SubmissionStatus {
  if (s.submitted_at === null || s.late_policy_status === 'missing') return 'missing'
  return s.submitted_at > s.cached_due_date ? 'late' : 'on_time'
}

const pctOf = (s: Submission) => ((s.score ?? 0) / assignmentById(s.assignment_id).points_possible) * 100

/* ---------- Assessment analytics ---------- */

export interface AssessmentFilter {
  term: string
  account: string | 'all'
  course: string | 'all'
}

export function coursesFor(term: string, account: string | 'all') {
  return COURSES.filter((c) => c.enrollment_term_id === term && (account === 'all' || c.account_id === account))
}

export function assessmentAnalytics(f: AssessmentFilter) {
  const courseIds = new Set(coursesFor(f.term, f.account).filter((c) => f.course === 'all' || c.id === f.course).map((c) => c.id))
  const subs = SUBMISSIONS.filter((s) => courseIds.has(s.course_id))
  const graded = subs.filter((s) => s.workflow_state === 'graded')

  const byStudent = [...groupBy(subs, (s) => s.user_id)].map(([userId, rows]) => {
    const scored = rows.filter((s) => s.workflow_state === 'graded')
    return {
      user_id: userId,
      name: userById(userId).sortable_name,
      courses: new Set(rows.map((s) => s.course_id)).size,
      average: round1(avg(scored.map(pctOf))),
      missing: rows.filter((s) => statusOf(s) === 'missing').length,
    }
  })

  const avgByCourse = [...groupBy(graded, (s) => s.course_id)]
    .map(([id, rows]) => ({ course: courseById(id).name, average: round1(avg(rows.map(pctOf))) }))
    .sort((a, b) => b.average - a.average)

  const BANDS = [
    { band: 'A', label: 'A (90 to 100)', min: 90 },
    { band: 'B', label: 'B (80 to 89)', min: 80 },
    { band: 'C', label: 'C (70 to 79)', min: 70 },
    { band: 'D', label: 'D (60 to 69)', min: 60 },
    { band: 'F', label: 'F (below 60)', min: -1 },
  ]
  const gradeDist = BANDS.map((b, i) => ({
    band: b.band,
    label: b.label,
    count: graded.filter((s) => {
      const p = pctOf(s)
      return p >= b.min && (i === 0 || p < BANDS[i - 1].min)
    }).length,
  }))

  const statusByCourse = [...groupBy(subs, (s) => s.course_id)]
    .map(([id, rows]) => {
      const n = rows.length
      const count = (st: SubmissionStatus) => rows.filter((s) => statusOf(s) === st).length
      return {
        course: courseById(id).name,
        on_time: round1((count('on_time') / n) * 100),
        late: round1((count('late') / n) * 100),
        missing: round1((count('missing') / n) * 100),
      }
    })
    .sort((a, b) => b.missing - a.missing)

  const termStart = Date.parse(termById(f.term).start_at)
  const trend = [...groupBy(graded, (s) => String(Math.floor((Date.parse(s.cached_due_date) - termStart) / (7 * 86_400_000)) + 1))]
    .map(([week, rows]) => ({ week: Number(week), average: round1(avg(rows.map(pctOf))), submissions: rows.length }))
    .sort((a, b) => a.week - b.week)

  const completion = [...groupBy(subs, (s) => s.assignment_id)]
    .map(([id, rows]) => {
      const a = assignmentById(id)
      return {
        assignment: a.name,
        course: courseById(a.course_id).name,
        expected: rows.length,
        rate: Math.round((rows.filter((s) => statusOf(s) !== 'missing').length / rows.length) * 100),
      }
    })
    .sort((a, b) => a.rate - b.rate)

  const byType = (['online_quiz', 'online_upload'] as const).map((t) => {
    const pcts = graded.filter((s) => assignmentById(s.assignment_id).submission_types === t).map(pctOf)
    return {
      type: t === 'online_quiz' ? 'Quiz or test' : 'Assignment or project',
      submissions: pcts.length,
      average: round1(avg(pcts)),
      lowest: round1(Math.min(...pcts)),
      highest: round1(Math.max(...pcts)),
    }
  })

  const statuses = subs.map(statusOf)
  return {
    kpis: {
      students: new Set(graded.map((s) => s.user_id)).size,
      average: round1(avg(graded.map(pctOf))),
      onTime: Math.round((statuses.filter((s) => s === 'on_time').length / statuses.length) * 100),
      atRisk: byStudent.filter((s) => s.average < AT_RISK_CUT).length,
      submissions: subs.length,
    },
    avgByCourse,
    gradeDist,
    statusByCourse,
    trend,
    completion,
    byType,
    atRiskStudents: byStudent.filter((s) => s.average < AT_RISK_CUT).sort((a, b) => a.average - b.average),
    topStudents: byStudent.filter((s) => s.average >= TOP_CUT).sort((a, b) => b.average - a.average),
  }
}

/* ---------- Outcomes: shared helpers ---------- */

const termOf = (r: OutcomeResult) => courseById(r.context_id).enrollment_term_id
const accountOf = (r: OutcomeResult) => courseById(r.context_id).account_id
const masteryRate = (rows: OutcomeResult[]) => (rows.length ? round1((rows.filter((r) => r.mastery).length / rows.length) * 100) : 0)
const [FALL, SPRING] = TERMS.map((t) => t.id)

/* ---------- Program assessment ---------- */

export function programAssessment() {
  const fall = OUTCOME_RESULTS.filter((r) => termOf(r) === FALL)
  const spring = OUTCOME_RESULTS.filter((r) => termOf(r) === SPRING)

  const byDepartment = ACCOUNTS.map((a) => {
    const f = fall.filter((r) => accountOf(r) === a.id)
    const s = spring.filter((r) => accountOf(r) === a.id)
    return {
      department: a.name,
      outcomes: LEARNING_OUTCOMES.filter((o) => o.account_id === a.id).length,
      courses: COURSES.filter((c) => c.account_id === a.id && c.enrollment_term_id === SPRING).length,
      alignments: OUTCOME_ALIGNMENTS.filter((al) => courseById(al.context_id).account_id === a.id).length,
      results: f.length + s.length,
      fall: masteryRate(f),
      spring: masteryRate(s),
      change: round1(masteryRate(s) - masteryRate(f)),
    }
  })

  const byTerm = TERMS.map((t) => {
    const rows = OUTCOME_RESULTS.filter((r) => termOf(r) === t.id)
    return {
      term: t.name,
      students: new Set(rows.map((r) => r.user_id)).size,
      results: rows.length,
      averageScore: round1(avg(rows.map((r) => r.score))),
      mastery: masteryRate(rows),
    }
  })

  return {
    kpis: {
      departments: ACCOUNTS.length,
      alignments: OUTCOME_ALIGNMENTS.length,
      assessments: ASSIGNMENTS.filter((a) => a.aligned).length,
      mastery: masteryRate(spring),
      growth: round1(masteryRate(spring) - masteryRate(fall)),
    },
    byDepartment,
    byTerm,
  }
}

/* ---------- Outcome results ---------- */

export interface OutcomeFilter {
  term: string
  account: string | 'all'
}

export function outcomeResults(f: OutcomeFilter) {
  const inScope = (r: OutcomeResult) => f.account === 'all' || accountOf(r) === f.account
  const rows = OUTCOME_RESULTS.filter((r) => termOf(r) === f.term && inScope(r))
  const fall = OUTCOME_RESULTS.filter((r) => termOf(r) === FALL && inScope(r))
  const spring = OUTCOME_RESULTS.filter((r) => termOf(r) === SPRING && inScope(r))

  const outcomes = LEARNING_OUTCOMES.filter((o) => f.account === 'all' || o.account_id === f.account)

  const distribution = outcomes
    .map((o) => {
      const rs = rows.filter((r) => r.learning_outcome_id === o.id)
      const share = (pts: number) => round1((rs.filter((r) => r.score === pts).length / rs.length) * 100)
      return {
        outcome: o.short_description,
        department: accountById(o.account_id).name,
        exceeds: share(4),
        mastery: share(3),
        near: share(2),
        remediate: share(1),
        rate: masteryRate(rs),
      }
    })
    .sort((a, b) => a.rate - b.rate)

  const trend = outcomes
    .map((o) => {
      const fr = fall.filter((r) => r.learning_outcome_id === o.id)
      const sr = spring.filter((r) => r.learning_outcome_id === o.id)
      return {
        outcome: o.short_description,
        department: accountById(o.account_id).name,
        fall: masteryRate(fr),
        spring: masteryRate(sr),
        change: round1(masteryRate(sr) - masteryRate(fr)),
      }
    })
    .sort((a, b) => a.change - b.change)

  const students = [...groupBy(rows, (r) => r.user_id)]
    .map(([userId, rs]) => {
      const perOutcome = [...groupBy(rs, (r) => r.learning_outcome_id)].map(([, xs]) => avg(xs.map((x) => x.score)))
      return {
        user_id: userId,
        name: userById(userId).sortable_name,
        outcomes: perOutcome.length,
        mastered: perOutcome.filter((s) => s >= MASTERY_POINTS).length,
        average: Math.round(avg(rs.map((r) => r.score)) * 100) / 100,
      }
    })
    .sort((a, b) => a.average - b.average || a.name.localeCompare(b.name))

  return {
    kpis: {
      outcomes: new Set(rows.map((r) => r.learning_outcome_id)).size,
      averageScore: Math.round(avg(rows.map((r) => r.score)) * 100) / 100,
      studentsAtMastery: Math.round((students.filter((s) => s.average >= MASTERY_POINTS).length / students.length) * 100),
      improvement: Math.round((avg(spring.map((r) => r.score)) - avg(fall.map((r) => r.score))) * 100) / 100,
      results: rows.length,
    },
    distribution,
    trend,
    students,
  }
}

export const ratingFor = (score: number) => RATINGS.find((r) => Math.floor(score) >= r.points) ?? RATINGS[3]
