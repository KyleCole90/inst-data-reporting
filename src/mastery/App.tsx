import { MasteryHeatMap } from './reports/MasteryHeatMap'
import { ItemHealth } from './reports/ItemHealth'
import { CoverageGaps } from './reports/CoverageGaps'
import { StudentReportCard } from './reports/StudentReportCard'
import { DISTRICT } from './data/seed'
import { ReportShell, useHashRoute } from '../shared/ReportShell'

const REPORTS = [
  { id: 'heatmap', label: 'Standards mastery', Component: MasteryHeatMap },
  { id: 'items', label: 'Item health', Component: ItemHealth },
  { id: 'coverage', label: 'Coverage gaps', Component: CoverageGaps },
  { id: 'card', label: 'Student report card', tag: 'Mock', tagTitle: 'Not backed by the API', Component: StudentReportCard },
] as const

const IDS = REPORTS.map((r) => r.id)

export function App() {
  const active = useHashRoute(IDS)
  const Current = REPORTS.find((r) => r.id === active)!.Component

  return (
    <ReportShell
      product="Mastery"
      title="Mastery reports"
      subtitle={`${DISTRICT.name} · built on MasteryConnect REST API v2`}
      reports={REPORTS}
      active={active}
      footer="Sample reports built against the MasteryConnect REST API v2 OpenAPI spec. Fixtures are shaped like real API responses, so swapping them for live calls is a config change. No real student data appears anywhere in this site."
    >
      <Current />
    </ReportShell>
  )
}
