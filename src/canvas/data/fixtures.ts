/** Sample institution shaped like Canvas Data 2 (DAP) tables. All invented.
 *  Course and department names are generic so the reports read the same for K12 and higher ed.
 *  Column names match the DAP `canvas` namespace so a live build swaps rows, not code. */

import { clamp, hash, makeRng, noise } from '../../shared/prng'

export const INSTITUTION = { id: '1', name: 'Riverbend Sample Institution' }

/** `accounts`: one sub-account per department. `growth` is the Fall to Spring shift in points. */
export const ACCOUNTS = [
  { id: '101', name: 'Science', parent_account_id: '1', growth: 3 },
  { id: '102', name: 'English', parent_account_id: '1', growth: 2 },
  { id: '103', name: 'Mathematics', parent_account_id: '1', growth: 2 },
  { id: '104', name: 'Social Studies', parent_account_id: '1', growth: -3 },
  { id: '105', name: 'Fine Arts', parent_account_id: '1', growth: 1 },
] as const

/** `enrollment_terms` */
export const TERMS = [
  { id: '1', name: 'Fall 2025', start_at: '2025-08-25', end_at: '2025-12-12' },
  { id: '2', name: 'Spring 2026', start_at: '2026-01-12', end_at: '2026-05-08' },
] as const

const COURSE_TEMPLATES = [
  { name: 'Introduction to Biology', account_id: '101', effect: -2 },
  { name: 'General Chemistry', account_id: '101', effect: -7 },
  { name: 'English Composition', account_id: '102', effect: 2 },
  { name: 'Literature and Analysis', account_id: '102', effect: -1 },
  { name: 'Algebra', account_id: '103', effect: -5 },
  { name: 'Statistics', account_id: '103', effect: -3 },
  { name: 'World History', account_id: '104', effect: 1 },
  { name: 'Civics and Government', account_id: '104', effect: 3 },
  { name: 'Art and Design Fundamentals', account_id: '105', effect: 6 },
] as const

export interface Course {
  id: string
  name: string
  account_id: string
  enrollment_term_id: string
  workflow_state: 'available'
  effect: number
}

/** `courses`: each template runs once per term. */
export const COURSES: Course[] = TERMS.flatMap((t) =>
  COURSE_TEMPLATES.map((c, i) => ({
    id: `${t.id}${String(i + 1).padStart(3, '0')}`,
    name: c.name,
    account_id: c.account_id,
    enrollment_term_id: t.id,
    workflow_state: 'available' as const,
    effect: c.effect,
  })),
)

/** `learning_outcomes`: two per department. */
export const LEARNING_OUTCOMES = [
  { id: '501', account_id: '101', short_description: 'Scientific Reasoning', description: 'Apply the scientific method to real problems' },
  { id: '502', account_id: '101', short_description: 'Experimental Design', description: 'Design and run a controlled investigation' },
  { id: '503', account_id: '102', short_description: 'Written Communication', description: 'Write clear, well-organized arguments' },
  { id: '504', account_id: '102', short_description: 'Critical Analysis', description: 'Analyze texts using evidence' },
  { id: '505', account_id: '103', short_description: 'Problem Solving', description: 'Solve multi-step quantitative problems' },
  { id: '506', account_id: '103', short_description: 'Quantitative Reasoning', description: 'Interpret and reason with data' },
  { id: '507', account_id: '104', short_description: 'Historical Thinking', description: 'Evaluate events using primary sources' },
  { id: '508', account_id: '104', short_description: 'Civic Reasoning', description: 'Analyze public issues and policy' },
  { id: '509', account_id: '105', short_description: 'Creative Expression', description: 'Show originality in composition' },
  { id: '510', account_id: '105', short_description: 'Technical Skill', description: 'Apply core techniques in a medium' },
] as const

/** The outcome rating scale. Mastery at 3 of 4 lines up with the 75% cut the Mastery reports use. */
export const RATINGS = [
  { points: 4, key: 'exceeds', label: 'Exceeds' },
  { points: 3, key: 'mastery', label: 'Mastery' },
  { points: 2, key: 'near', label: 'Near mastery' },
  { points: 1, key: 'remediate', label: 'Remediate' },
] as const
export const MASTERY_POINTS = 3
export const POSSIBLE_POINTS = 4

const ASSIGNMENT_TEMPLATES = [
  { name: 'Diagnostic Quiz', submission_types: 'online_quiz', points_possible: 20, week: 2, aligned: false },
  { name: 'Unit 1 Assignment', submission_types: 'online_upload', points_possible: 50, week: 4, aligned: false },
  { name: 'Unit 2 Quiz', submission_types: 'online_quiz', points_possible: 30, week: 6, aligned: false },
  { name: 'Midterm Exam', submission_types: 'online_quiz', points_possible: 100, week: 8, aligned: true },
  { name: 'Unit 3 Assignment', submission_types: 'online_upload', points_possible: 50, week: 11, aligned: false },
  { name: 'Final Project', submission_types: 'online_upload', points_possible: 100, week: 14, aligned: true },
] as const

export interface Assignment {
  id: string
  course_id: string
  name: string
  submission_types: 'online_quiz' | 'online_upload'
  points_possible: number
  due_at: string
  workflow_state: 'published'
  /** Has outcome alignments (a `content_tags` row per outcome). */
  aligned: boolean
}

const DAY = 86_400_000
const addDays = (iso: string, days: number) => new Date(Date.parse(iso) + days * DAY).toISOString()
export const termById = (id: string) => TERMS.find((t) => t.id === id)!
export const courseById = (id: string) => COURSES.find((c) => c.id === id)!
export const accountById = (id: string) => ACCOUNTS.find((a) => a.id === id)!
export const outcomeById = (id: string) => LEARNING_OUTCOMES.find((o) => o.id === id)!

/** `assignments` */
export const ASSIGNMENTS: Assignment[] = COURSES.flatMap((c) =>
  ASSIGNMENT_TEMPLATES.map((a, i) => ({
    id: `${c.id}${i + 1}`,
    course_id: c.id,
    name: a.name,
    submission_types: a.submission_types,
    points_possible: a.points_possible,
    due_at: addDays(termById(c.enrollment_term_id).start_at, a.week * 7 - 2),
    workflow_state: 'published' as const,
    aligned: a.aligned,
  })),
)
export const assignmentById = (id: string) => ASSIGNMENTS.find((a) => a.id === id)!

const FIRST = ['Adaeze', 'Bjorn', 'Camila', 'Darius', 'Esme', 'Felix', 'Greta', 'Hamza', 'Ines', 'Jun',
  'Keira', 'Luca', 'Malia', 'Nico', 'Odette', 'Pavel', 'Rosalind', 'Santiago', 'Talia', 'Viktor',
  'Willa', 'Yara', 'Zane', 'Anouk', 'Bram', 'Cyrus', 'Delphine', 'Emeka', 'Fiona', 'Gideon']
const LAST = ['Abernathy', 'Brennan', 'Cardoso', 'Delacroix', 'Ekwueme', 'Farrow', 'Guzman', 'Holloway',
  'Iverson', 'Jaramillo', 'Kowalski', 'Lindgren', 'Mbeki', 'Novak', 'Okafor', 'Pereira', 'Quist',
  'Renner', 'Sorensen', 'Trujillo', 'Valdez', 'Winslow', 'Zielinski', 'Ashby']

export interface User {
  id: string
  sortable_name: string
  /** Overall ability offset, in percentage points. */
  effect: number
}

/** `users`: students only. */
export const USERS: User[] = (() => {
  const rng = makeRng(hash('canvas:users'))
  const seen = new Set<string>()
  const out: User[] = []
  while (out.length < 240) {
    const name = `${LAST[Math.floor(rng() * LAST.length)]}, ${FIRST[Math.floor(rng() * FIRST.length)]}`
    if (seen.has(name)) continue
    seen.add(name)
    out.push({ id: String(7001 + out.length), sortable_name: name, effect: Math.round(noise(rng) * 26) })
  }
  return out
})()
export const userById = (id: string) => USERS.find((u) => u.id === id)!

/** `enrollments`: every student takes four courses a term. */
export const ENROLLMENTS = USERS.flatMap((u) =>
  TERMS.flatMap((t) => {
    const rng = makeRng(hash(`enroll:${u.id}:${t.id}`))
    const pool = COURSES.filter((c) => c.enrollment_term_id === t.id)
    const picked = new Set<string>()
    while (picked.size < 4) picked.add(pool[Math.floor(rng() * pool.length)].id)
    return [...picked].map((course_id) => ({
      id: `${u.id}-${course_id}`,
      user_id: u.id,
      course_id,
      type: 'StudentEnrollment' as const,
      workflow_state: 'active' as const,
    }))
  }),
)

export interface Submission {
  id: string
  assignment_id: string
  course_id: string
  user_id: string
  score: number | null
  submitted_at: string | null
  cached_due_date: string
  workflow_state: 'graded' | 'unsubmitted'
  late_policy_status: 'missing' | null
}

/** `submissions`: one per enrolled student per assignment. Late is derived from timestamps, as in Canvas. */
export const SUBMISSIONS: Submission[] = ENROLLMENTS.flatMap((e) => {
  const user = userById(e.user_id)
  const course = courseById(e.course_id)
  const growth = e.course_id.startsWith('2') ? accountById(course.account_id).growth : 0
  return ASSIGNMENTS.filter((a) => a.course_id === e.course_id).map((a) => {
    const rng = makeRng(hash(`sub:${e.user_id}:${a.id}`))
    const id = `${a.id}-${e.user_id}`
    const missing = rng() < 0.05 + Math.max(0, -user.effect) * 0.006
    if (missing) {
      return { id, assignment_id: a.id, course_id: a.course_id, user_id: e.user_id, score: null, submitted_at: null,
        cached_due_date: a.due_at, workflow_state: 'unsubmitted' as const, late_policy_status: 'missing' as const }
    }
    const late = rng() < 0.05
    const typeEffect = a.submission_types === 'online_quiz' ? -3 : 1
    const pct = clamp(78 + course.effect + growth + user.effect + typeEffect + noise(rng) * 12, 22, 100)
    const offsetHours = late ? 6 + rng() * 60 : -(2 + rng() * 70)
    return {
      id, assignment_id: a.id, course_id: a.course_id, user_id: e.user_id,
      score: Math.round((pct / 100) * a.points_possible),
      submitted_at: new Date(Date.parse(a.due_at) + offsetHours * 3_600_000).toISOString(),
      cached_due_date: a.due_at, workflow_state: 'graded' as const, late_policy_status: null,
    }
  })
})

/** `content_tags`: one alignment per outcome per aligned assignment. */
export const OUTCOME_ALIGNMENTS = ASSIGNMENTS.filter((a) => a.aligned).flatMap((a) =>
  LEARNING_OUTCOMES.filter((o) => o.account_id === courseById(a.course_id).account_id).map((o) => ({
    id: `${a.id}-${o.id}`,
    content_id: a.id,
    learning_outcome_id: o.id,
    context_id: a.course_id,
  })),
)

export interface OutcomeResult {
  id: string
  user_id: string
  context_id: string
  learning_outcome_id: string
  associated_asset_id: string
  score: number
  possible: number
  mastery: boolean
  percent: number
  assessed_at: string
}

/** `learning_outcome_results`: a rubric rating per aligned, submitted assignment. */
export const OUTCOME_RESULTS: OutcomeResult[] = OUTCOME_ALIGNMENTS.flatMap((al) => {
  const a = assignmentById(al.content_id)
  return SUBMISSIONS.filter((s) => s.assignment_id === a.id && s.score !== null).map((s) => {
    const rng = makeRng(hash(`lor:${s.id}:${al.learning_outcome_id}`))
    const pct = ((s.score ?? 0) / a.points_possible) * 100 + noise(rng) * 10
    const score = pct >= 90 ? 4 : pct >= 75 ? 3 : pct >= 60 ? 2 : 1
    return {
      id: `${s.id}-${al.learning_outcome_id}`,
      user_id: s.user_id,
      context_id: a.course_id,
      learning_outcome_id: al.learning_outcome_id,
      associated_asset_id: a.id,
      score,
      possible: POSSIBLE_POINTS,
      mastery: score >= MASTERY_POINTS,
      percent: score / POSSIBLE_POINTS,
      assessed_at: s.submitted_at!,
    }
  })
})
