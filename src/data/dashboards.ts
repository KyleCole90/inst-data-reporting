// Dashboards listed on the landing page.

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
const CANVAS = `${import.meta.env.BASE_URL}canvas/`

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
    id: 'cv-assessment',
    title: 'Assessment analytics',
    product: 'Canvas',
    question: 'How are students scoring, and where are submissions late or missing?',
    source: 'Canvas Data 2 (sample fixtures)',
    status: 'live',
    href: `${CANVAS}#assessment`,
  },
  {
    id: 'cv-programs',
    title: 'Program assessment',
    product: 'Canvas',
    question: 'Which departments are moving students toward mastery of their outcomes?',
    source: 'Canvas Data 2 (sample fixtures)',
    status: 'live',
    href: `${CANVAS}#programs`,
  },
  {
    id: 'cv-outcomes',
    title: 'Outcome results',
    product: 'Canvas',
    question: 'How do students rate on each learning outcome, and what changed between terms?',
    source: 'Canvas Data 2 (sample fixtures)',
    status: 'live',
    href: `${CANVAS}#outcomes`,
  },
]

export const PRODUCTS: Product[] = ['Canvas', 'Mastery']
