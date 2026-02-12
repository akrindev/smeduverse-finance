import { Button, Card, Chip, Input, Spinner, TextField, Modal, Form, Label, ListBox, Select, Switch, useOverlayState, FieldError } from '@heroui/react'
import { createFileRoute } from '@tanstack/react-router'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Search, Plus, Edit2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { useFeeTypes, useCreateFeeType, useUpdateFeeType } from '@/hooks/use-fee-types'
import { TablePagination } from '@/lib/table-pagination'
import type { BillingCycle, FeeType } from '@/types/finance'

import {
  cardHeaderClass,
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'

export const Route = createFileRoute('/dashboard/fee-types')({
  component: FeeTypesPage,
})

const billingCycleLabels: Record<BillingCycle, string> = {
  monthly: 'Bulanan',
  one_time: 'Sekali',
  custom: 'Kustom',
}

function FeeTypesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 })
  
  const modalState = useOverlayState()
  const [editingFeeType, setEditingFeeType] = useState<FeeType | null>(null)
  
  const { data, isLoading, isPlaceholderData, isFetching, error } = useFeeTypes({
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    search: searchQuery || undefined,
  })
  
  const createMutation = useCreateFeeType()
  const updateMutation = useUpdateFeeType(editingFeeType?.id ?? 0)

  const feeTypesData = data?.data ?? []
  const meta = data?.meta

  const table = useReactTable({
    data: feeTypesData,
    columns: useMemo(() => [{ accessorKey: 'id' }], []),
    pageCount: meta?.last_page ?? -1,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  })

  const handleAdd = () => {
    setEditingFeeType(null)
    modalState.open()
  }

  const handleEdit = (feeType: FeeType) => {
    setEditingFeeType(feeType)
    modalState.open()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const payload = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      billing_cycle: formData.get('billing_cycle') as BillingCycle,
      is_active: formData.get('is_active') === 'on',
      allow_partial: formData.get('allow_partial') === 'on',
    }

    try {
      if (editingFeeType) {
        await updateMutation.mutateAsync(payload)
      } else {
        await createMutation.mutateAsync(payload)
      }
      modalState.close()
    } catch (err) {
      console.error(err)
    }
  }

  if (isLoading && !isPlaceholderData) {
    return <LoadingState minHeight="400px" />
  }

  if (error) {
    return <ErrorState message="Gagal memuat data. Silakan coba lagi." />
  }

  return (
    <div className={pageShellClass}>
      <PageHeader title="Jenis Biaya" description="Kelola jenis biaya dan tagihan sekolah">
        <Button
          variant="primary"
          className="bg-accent text-accent-foreground"
          onPress={handleAdd}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Jenis Biaya
        </Button>
      </PageHeader>

      <Card className={surfaceCardClass}>
        <Card.Header className={cardHeaderClass}>
          <TextField fullWidth>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-500 z-10" />
              <Input
                placeholder="Cari jenis biaya..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                }}
              />
            </div>
          </TextField>
        </Card.Header>
        <Card.Content className="relative min-h-[300px]">
          {isFetching && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-[1px] transition-opacity">
              <Spinner size="lg" />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-border/70">
                  <th className={tableHeadCellClass}>Kode</th>
                  <th className={tableHeadCellClass}>Nama</th>
                  <th className={`${tableHeadCellClass} hidden sm:table-cell`}>Siklus</th>
                  <th className={`${tableHeadCellClass} hidden md:table-cell`}>Status</th>
                  <th className={`${tableHeadCellClass} text-right`}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {feeTypesData.map((feeType) => (
                  <tr key={feeType.id} className="border-t border-border/50 hover:bg-surface/60 transition-colors">
                    <td className={`${tableBodyCellClass} font-mono text-xs text-default-500`}>{feeType.code}</td>
                    <td className={`${tableBodyCellClass} font-medium`}>{feeType.name}</td>
                    <td className={`${tableBodyCellClass} hidden sm:table-cell`}>
                      <Chip size="sm" variant="soft" color="default">
                        <Chip.Label>{billingCycleLabels[feeType.billing_cycle]}</Chip.Label>
                      </Chip>
                    </td>
                    <td className={`${tableBodyCellClass} hidden md:table-cell`}>
                      <Chip size="sm" variant="soft" color={feeType.is_active ? 'success' : 'default'}>
                        <Chip.Label>{feeType.is_active ? 'Aktif' : 'Nonaktif'}</Chip.Label>
                      </Chip>
                    </td>
                    <td className={`${tableBodyCellClass} text-right`}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => handleEdit(feeType)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {feeTypesData.length === 0 && (
            <EmptyState icon={Search} message="Tidak ada jenis biaya ditemukan" />
          )}

          <TablePagination
            pageIndex={pagination.pageIndex}
            pageCount={table.getPageCount()}
            pageSize={pagination.pageSize}
            totalRows={meta?.total ?? 0}
            visibleRows={feeTypesData.length}
            canPreviousPage={table.getCanPreviousPage()}
            canNextPage={table.getCanNextPage()}
            onPreviousPage={() => table.previousPage()}
            onNextPage={() => table.nextPage()}
          />
        </Card.Content>
      </Card>

      <Modal>
        <Modal.Backdrop isOpen={modalState.isOpen} onOpenChange={modalState.setOpen}>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-lg">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>{editingFeeType ? 'Edit Jenis Biaya' : 'Tambah Jenis Biaya'}</Modal.Heading>
              </Modal.Header>
              <Form onSubmit={handleSubmit}>
                <Modal.Body className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <TextField isRequired name="code" defaultValue={editingFeeType?.code}>
                      <Label>Kode</Label>
                      <Input placeholder="Contoh: SPP-SMA" />
                      <FieldError />
                    </TextField>
                    <TextField isRequired name="name" defaultValue={editingFeeType?.name}>
                      <Label>Nama</Label>
                      <Input placeholder="Contoh: SPP SMA" />
                      <FieldError />
                    </TextField>
                  </div>
                  
                  <TextField name="description" defaultValue={editingFeeType?.description || ''}>
                    <Label>Deskripsi</Label>
                    <Input placeholder="Keterangan opsional" />
                  </TextField>

                  <Select
                    isRequired
                    name="billing_cycle"
                    defaultValue={editingFeeType?.billing_cycle || 'monthly'}
                  >
                    <Label>Siklus Tagihan</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {Object.entries(billingCycleLabels).map(([value, label]) => (
                          <ListBox.Item key={value} id={value} textValue={label}>
                            {label}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                    <FieldError />
                  </Select>

                  <div className="flex flex-col gap-4 pt-2">
                    <Switch name="allow_partial" defaultSelected={editingFeeType?.allow_partial ?? true}>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Label className="text-sm">Izinkan Pembayaran Parsial</Label>
                    </Switch>

                    <Switch name="is_active" defaultSelected={editingFeeType?.is_active ?? true}>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Label className="text-sm">Status Aktif</Label>
                    </Switch>
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" slot="close">
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-accent text-accent-foreground"
                    isPending={createMutation.isPending || updateMutation.isPending}
                  >
                    {({isPending}) => (
                      <>
                        {isPending ? <Spinner color="current" size="sm" /> : null}
                        Simpan
                      </>
                    )}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  )
}
