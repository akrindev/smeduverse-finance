import { Button, Chip } from '@heroui/react'

interface TablePaginationProps {
  pageIndex: number
  pageCount: number
  pageSize: number
  totalRows: number
  visibleRows: number
  canPreviousPage: boolean
  canNextPage: boolean
  onPreviousPage: () => void
  onNextPage: () => void
}

export function TablePagination({
  pageIndex,
  pageCount,
  pageSize,
  totalRows,
  visibleRows,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
}: TablePaginationProps) {
  if (totalRows === 0) {
    return null
  }

  const from = pageIndex * pageSize + 1
  const to = from + visibleRows - 1

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-xs text-default-500">
        Menampilkan {from}-{to} dari {totalRows} data
      </p>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onPress={onPreviousPage} isDisabled={!canPreviousPage}>
          Sebelumnya
        </Button>
        <Chip size="sm" variant="soft" color="default">
          <Chip.Label>Halaman {Math.max(pageIndex + 1, 1)} / {Math.max(pageCount, 1)}</Chip.Label>
        </Chip>
        <Button size="sm" variant="secondary" onPress={onNextPage} isDisabled={!canNextPage}>
          Berikutnya
        </Button>
      </div>
    </div>
  )
}
