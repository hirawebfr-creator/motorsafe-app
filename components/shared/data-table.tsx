'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

export interface DataTableColumn<T> {
  key: string
  label: string
  sortable?: boolean
  width?: string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  totalCount: number
  page: number
  limit: number
  onSort?: (key: string) => void
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  totalCount,
  page,
  limit,
  onSort
}: DataTableProps<T>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const totalPages = Math.ceil(totalCount / limit)
  const startRow = (page - 1) * limit + 1
  const endRow = Math.min(page * limit, totalCount)

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-[var(--ms-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort?.(column.key)}
                      className="hover:text-[var(--ms-text)] transition-colors"
                    >
                      {column.label}
                    </button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-[var(--ms-text-muted)]">
                  Aucun résultat trouvé.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render 
                        ? column.render(row) 
                        : String(row[column.key as keyof T] ?? '')
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-[var(--ms-text-muted)]">
          {startRow}-{endRow} sur {totalCount}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={String(limit)}
            onChange={(e) => updateParams('limit', e.target.value)}
            className="h-9 w-[70px] rounded-lg border border-[var(--ms-border)] bg-white px-2 text-sm outline-none focus:border-[var(--ms-primary)] focus:ring-2 focus:ring-[var(--ms-primary)]/20"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateParams('page', '1')}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateParams('page', String(page - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1 px-2">
              <span className="text-sm">Page {page} sur {totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => updateParams('page', String(page + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateParams('page', String(totalPages))}
              disabled={page === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
