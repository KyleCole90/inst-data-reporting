// Dashboards listed on the landing page. Canvas entries are placeholders until those reports exist.

export type Product = 'Canvas' | 'Mastery'
export type Status = 'live' | 'coming-soon'

export type Dashboard = {
  id: string
  title: string
  product: Product
  question: string
  source: string
  status: Status
  href: string
}

const MC = `${import.meta.env.BASE_URL}mastery/`

export const DASHBOARDS: Dashboard[] = [
  {
    id: 'mc-heatmap',
    title: 'Standards mastery heat map',
    product: 'Mastery',
    question: 'Which standards are weak, and is it one teacher or the whole district?',
    source: 'MasteryConnect REST API v2',
    status: 'live',
    href: `${MC}#heatmap`,
  },
  {
    id: 'mc-items',
    title: 'Assessment item health',
    product: 'Mastery',
    question: 'Which items are broken, not just hard?',
    source: 'MasteryConnect REST API v2',
    status: 'live',
    href: `${MC}#items`,
  },
  {
    id: 'mc-coverage',
    title: 'Curriculum map coverage gaps',
    product: 'Mastery',
    question: 'What did we plan to teach but never assess?',
    source: 'MasteryConnect REST API v2',
    status: 'live',
    href: `${MC}#coverage`,
  },
  {
    id: 'mc-card',
    title: 'Student standards report card',
    product: 'Mastery',
    question: 'Where does one student stand on every standard?',
    source: 'Mock shape, not API-backed',
    status: 'live',
    href: `${MC}#card`,
  },
  {
    id: 'cv-activity',
    title: 'Course activity and engagement',
    product: 'Canvas',
    question: 'Which courses are students actually showing up to each week?',
    source: 'Canvas Data 2 (placeholder)',
    status: 'coming-soon',
    href: '#',
  },
  {
    id: 'cv-submissions',
    title: 'Assignment submission timeliness',
    product: 'Canvas',
    question: 'Where are late and missing submissions piling up?',
    source: 'Canvas Data 2 (placeholder)',
    status: 'coming-soon',
    href: '#',
  },
  {
    id: 'cv-grades',
    title: 'Grade distribution by course',
    product: 'Canvas',
    question: 'Which sections grade noticeably harder or easier than peers?',
    source: 'Canvas Data 2 (placeholder)',
    status: 'coming-soon',
    href: '#',
  },
  {
    id: 'cv-readiness',
    title: 'Course readiness at term start',
    product: 'Canvas',
    question: 'Which courses are still unpublished or empty on day one?',
    source: 'Canvas Data 2 (placeholder)',
    status: 'coming-soon',
    href: '#',
  },
]

export const PRODUCTS: Product[] = ['Canvas', 'Mastery']
