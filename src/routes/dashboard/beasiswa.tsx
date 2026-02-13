import { createFileRoute } from '@tanstack/react-router'
import { BadgePercent, CalendarDays, GraduationCap, Plus, Users, Edit2, UserPlus } from 'lucide-react'
import { Button, Card, Chip, Input, Spinner, TextField, Modal, Form, Label, ListBox, Select, Switch, useOverlayState, FieldError } from '@heroui/react'
import { useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { useScholarships, useCreateScholarship, useUpdateScholarship } from '@/hooks/use-scholarships'
import { useFeeTypes } from '@/hooks/use-fee-types'
import { TablePagination } from '@/lib/table-pagination'
import { formatCurrency } from '@/lib/format'
import type { DiscountType, Scholarship } from '@/types/finance'
import {
  cardHeaderClass,
  pageShellClass,
  surfaceCardClass,
} from '@/lib/page-styles'
import { AssignScholarshipModal } from '@/components/beasiswa/assign-scholarship-modal'

export const Route = createFileRoute('/dashboard/beasiswa')({
  component: BeasiswaPage,
})

function formatScholarshipValue(discountType: 'fixed' | 'percent', discountValue: number): string {
  if (discountType === 'percent') {
    return `${discountValue}%`
  }

  return formatCurrency(discountValue)
}

function BeasiswaPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 })

  const modalState = useOverlayState()
  const assignModalState = useOverlayState()
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null)

  const { data, isLoading, isPlaceholderData, isFetching, error } = useScholarships({
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    search: searchQuery || undefined,
  })

  const { data: feeTypesData } = useFeeTypes({ per_page: 100 })
  const feeTypes = feeTypesData?.data ?? []

  const createMutation = useCreateScholarship()
  const updateMutation = useUpdateScholarship(editingScholarship?.id ?? 0)

  const scholarshipsData = data?.data ?? []
  const meta = data?.meta

  const activeCount = scholarshipsData.filter((item) => item.is_active).length
  const inactiveCount = scholarshipsData.length - activeCount

  const handleAdd = () => {
    setEditingScholarship(null)
    modalState.open()
  }

  const handleEdit = (scholarship: Scholarship) => {
    setEditingScholarship(scholarship)
    modalState.open()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const payload = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      discount_type: formData.get('discount_type') as DiscountType,
      discount_value: Number(formData.get('discount_value')),
      finance_fee_type_id: formData.get('finance_fee_type_id') ? Number(formData.get('finance_fee_type_id')) : null,
      start_date: formData.get('start_date') as string || null,
      end_date: formData.get('end_date') as string || null,
      is_active: formData.get('is_active') === 'on',
    }

    try {
      if (editingScholarship) {
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
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message="Gagal memuat data beasiswa." detail="Silakan coba lagi dalam beberapa saat." />
  }

  return (
    <div className={pageShellClass}>
      <PageHeader title="Manajemen Beasiswa" description="Program beasiswa berbasis data API Finance.">
        <div className="flex gap-2">
          <Button variant="secondary" onPress={() => assignModalState.open()}>
            <UserPlus className="w-4 h-4 mr-2" />
            Assign ke Siswa
          </Button>
          <Button variant="primary" className="bg-accent text-accent-foreground" onPress={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Program
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={GraduationCap}
          iconBgClass="bg-accent-soft"
          iconColorClass="text-accent"
          label="Total Program"
          value={meta?.total ?? 0}
        />
        <StatCard
          icon={Users}
          iconBgClass="bg-success/15"
          iconColorClass="text-success"
          label="Aktif"
          value={activeCount}
        />
        <StatCard
          icon={CalendarDays}
          iconBgClass="bg-warning/15"
          iconColorClass="text-warning"
          label="Nonaktif"
          value={inactiveCount}
        />
      </div>

      <Card className={surfaceCardClass}>
        <Card.Header className={cardHeaderClass}>
          <TextField fullWidth>
            <Input
              aria-label="Cari beasiswa"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
              placeholder="Cari nama, kode, atau deskripsi beasiswa"
            />
          </TextField>
        </Card.Header>
        <Card.Content className="relative min-h-[300px]">
          {isFetching && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-[1px] transition-opacity">
              <Spinner size="lg" />
            </div>
          )}
          {scholarshipsData.length === 0 ? (
            <EmptyState icon={GraduationCap} message="Tidak ada data beasiswa ditemukan." />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {scholarshipsData.map((item) => (
                  <Card key={item.id} className={surfaceCardClass}>
                    <Card.Content className="space-y-3 relative">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-default-500 font-mono">{item.code}</p>
                          <h3 className="text-base font-semibold mt-1">{item.name}</h3>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Chip
                            size="sm"
                            variant="soft"
                            color={item.is_active ? 'success' : 'default'}
                          >
                            <Chip.Label>{item.is_active ? 'Aktif' : 'Nonaktif'}</Chip.Label>
                          </Chip>
                          <Button size="sm" isIconOnly variant="secondary" onPress={() => handleEdit(item)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-default-500 line-clamp-2 min-h-[40px]">
                        {item.description ?? 'Tanpa deskripsi'}
                      </p>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="rounded-2xl bg-accent-soft/40 p-3">
                          <div className="text-xs text-default-500 flex items-center gap-1.5">
                            <BadgePercent className="w-3.5 h-3.5" />
                            Nilai Diskon
                          </div>
                          <p className="text-sm font-semibold mt-1">
                            {formatScholarshipValue(item.discount_type, item.discount_value)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-surface p-3 border border-border/50">
                          <div className="text-xs text-default-500">Tipe Biaya</div>
                          <p className="text-sm font-semibold mt-1 truncate">{item.fee_type?.name ?? 'Semua biaya'}</p>
                        </div>
                      </div>

                      <div className="text-xs text-default-500">
                        Periode:{' '}
                        {item.start_date ?? '-'} sampai {item.end_date ?? '-'}
                      </div>
                    </Card.Content>
                  </Card>
                ))}
              </div>

              <TablePagination
                pageIndex={pagination.pageIndex}
                pageCount={meta?.last_page ?? 1}
                pageSize={pagination.pageSize}
                totalRows={meta?.total ?? 0}
                visibleRows={scholarshipsData.length}
                canPreviousPage={pagination.pageIndex > 0}
                canNextPage={pagination.pageIndex < (meta?.last_page ?? 1) - 1}
                onPreviousPage={() => setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }))}
                onNextPage={() => setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
              />
            </>
          )}
        </Card.Content>
      </Card>

      <Modal>
        <Modal.Backdrop isOpen={modalState.isOpen} onOpenChange={modalState.setOpen}>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>{editingScholarship ? 'Edit Program Beasiswa' : 'Tambah Program Beasiswa'}</Modal.Heading>
              </Modal.Header>
              <Form onSubmit={handleSubmit}>
                <Modal.Body className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <TextField isRequired name="code" defaultValue={editingScholarship?.code}>
                      <Label>Kode</Label>
                      <Input placeholder="Contoh: BSW-PRESTASI" />
                      <FieldError />
                    </TextField>
                    <TextField isRequired name="name" defaultValue={editingScholarship?.name}>
                      <Label>Nama</Label>
                      <Input placeholder="Contoh: Beasiswa Prestasi" />
                      <FieldError />
                    </TextField>
                  </div>

                  <TextField name="description" defaultValue={editingScholarship?.description || ''}>
                    <Label>Deskripsi</Label>
                    <Input placeholder="Keterangan opsional" />
                  </TextField>

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      isRequired
                      name="discount_type"
                      defaultValue={editingScholarship?.discount_type || 'percent'}
                    >
                      <Label>Tipe Potongan</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          <ListBox.Item id="percent" textValue="Persentase (%)">Persentase (%)</ListBox.Item>
                          <ListBox.Item id="fixed" textValue="Nominal Tetap (Rp)">Nominal Tetap (Rp)</ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                      <FieldError />
                    </Select>
                    <TextField isRequired name="discount_value" type="number" defaultValue={editingScholarship?.discount_value?.toString()}>
                      <Label>Nilai Potongan</Label>
                      <Input placeholder="Contoh: 50 atau 500000" />
                      <FieldError />
                    </TextField>
                  </div>

                  <Select
                    name="finance_fee_type_id"
                    defaultValue={editingScholarship?.finance_fee_type_id?.toString() || ''}
                  >
                    <Label>Berlaku Untuk Biaya (Opsional)</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item id="" textValue="Semua Biaya">Semua Biaya</ListBox.Item>
                        {feeTypes.map((ft) => (
                          <ListBox.Item key={ft.id} id={ft.id.toString()} textValue={ft.name}>
                            {ft.name}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  <div className="grid grid-cols-2 gap-4">
                    <TextField name="start_date" type="date" defaultValue={editingScholarship?.start_date || ''}>
                      <Label>Tanggal Mulai</Label>
                      <Input />
                    </TextField>
                    <TextField name="end_date" type="date" defaultValue={editingScholarship?.end_date || ''}>
                      <Label>Tanggal Berakhir</Label>
                      <Input />
                    </TextField>
                  </div>

                  <Switch name="is_active" defaultSelected={editingScholarship?.is_active ?? true}>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <Label className="text-sm">Status Aktif</Label>
                  </Switch>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" slot="close">Batal</Button>
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

      <AssignScholarshipModal 
        state={assignModalState}
      />
    </div>
  )
}
