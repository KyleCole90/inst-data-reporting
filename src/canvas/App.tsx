import { AssessmentAnalytics } from './reports/AssessmentAnalytics'
import { ProgramAssessment } from './reports/ProgramAssessment'
import { OutcomeResults } from './reports/OutcomeResults'
import { INSTITUTION } from './data/fixtures'
import { ReportShell, useHashRoute } from '../shared/ReportShell'

const REPORTS = [
  { id: 'assessment', label: 'Assessment analytics', Component: AssessmentAnalytics },
  { id: 'programs', label: 'Program assessment', Component: ProgramAssessment },
  { id: 'outcomes', label: 'Outcome results', Component: OutcomeResults },
] as const

const IDS = REPORTS.map((r) => r.id)

export function App() {
  const active = useHashRoute(IDS)
  const Current = REPORTS.find((r) => r.id === active)!.Component

  return (
    <ReportShell
      product="Canvas"
      title="Canvas assessment reports"
      subtitle={`${INSTITUTION.name} · built on Canvas Data 2`}
      reports={REPORTS}
      active={active}
      footer="Sample reports modeled on Canvas Data 2 (DAP) tables. Fixtures use real table and column names, so swapping them for a live query changes the rows, not the reports. No real student data appears anywhere in this site."
    >
      <Current />
    </ReportShell>
  )
}
