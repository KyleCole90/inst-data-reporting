import { useState } from 'react'
import { ArrowUpRight, LayoutGrid, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { DASHBOARDS, PRODUCTS, type Product } from '@/data/dashboards'

type Filter = 'all' | Product

const FILTERS: { key: Filter; label: string; count: number }[] = [
  { key: 'all', label: 'All dashboards', count: DASHBOARDS.length },
  ...PRODUCTS.map((p) => ({ key: p, label: p, count: DASHBOARDS.filter((d) => d.product === p).length })),
]

export default function App() {
  const [product, setProduct] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const shown = DASHBOARDS.filter(
    (d) =>
      (product === 'all' || d.product === product) &&
      (!needle || `${d.title} ${d.question}`.toLowerCase().includes(needle)),
  )

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-muted/30 p-4 md:flex">
        <div className="flex items-center gap-2 px-2 py-1">
          <LayoutGrid className="size-5" />
          <span className="font-semibold">Data reporting</span>
        </div>
        <p className="px-2 text-xs text-muted-foreground">Sample dashboards</p>
        <Separator className="my-4" />
        <nav className="space-y-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setProduct(f.key)}
              aria-current={product === f.key}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm',
                product === f.key ? 'bg-muted font-medium' : 'text-muted-foreground hover:bg-muted/60',
              )}
            >
              {f.label}
              <span className="text-xs tabular-nums">{f.count}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          Sample data only. Every name and number is invented.
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="bg-amber-400 px-4 py-1.5 text-center text-xs font-medium text-zinc-950 md:hidden">
          Sample data only. Every name and number is invented.
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-5 md:px-8">
          <div>
            <h1 className="text-xl font-semibold">{product === 'all' ? 'All dashboards' : `${product} dashboards`}</h1>
            <p className="text-sm text-muted-foreground">Demo reports on synthetic data.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dashboards"
              aria-label="Search dashboards"
              className="pl-8"
            />
          </div>
          <div className="flex gap-2 md:hidden">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setProduct(f.key)}
                aria-current={product === f.key}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm',
                  product === f.key ? 'bg-muted font-medium' : 'text-muted-foreground',
                )}
              >
                {f.key === 'all' ? 'All' : f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-6 md:px-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dashboard</TableHead>
                <TableHead className="hidden md:table-cell">Product</TableHead>
                <TableHead className="hidden md:table-cell">Data source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="max-w-md min-w-48 whitespace-normal">
                    <div className="font-medium">{d.title}</div>
                    <div className="text-xs text-muted-foreground">{d.question}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{d.product}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{d.source}</TableCell>
                  <TableCell>
                    {d.status === 'live' ? (
                      <Badge className="bg-emerald-600 text-white">Live</Badge>
                    ) : (
                      <Badge variant="outline">Coming soon</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <a href={d.href} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                      Open <ArrowUpRight />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
              {shown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No dashboards match “{query}”.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  )
}
