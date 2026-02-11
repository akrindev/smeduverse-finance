import { createFileRoute, Link } from '@tanstack/react-router'
import { getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { Download, ExternalLink, Plus } from 'lucide-react'
import {
  Button,
  Card,
  Chip,
  Input,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextArea,
  TextField,
  toast,
  useOverlayState,
} from '@heroui/react'
import { Controller, useForm } from 'react-hook-form'
import { useEffect, useMemo, useState } from 'react'
import { useBills, useGenerateFee, useGenerateSpp } from '@/hooks/use-bills'
import { useFeeTypes } from '@/hooks/use-fee-types'
import { ApiResponseError } from '@/lib/api-client'
import {
  cardHeaderClass,
  pageHeaderClass,
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'
import { TablePagination } from '@/lib/table-pagination'
import type { BillStatus } from '@/types/finance'

interface GenerateSppFormValues {
  rombongan_belajar_id: string
  period_month: string
  period_year: string
  amount: string
  due_date: string
  title: string
  description: string
  student_ids: string
}

interface GenerateFeeFormValues {
  finance_fee_type_id: string
  student_ids: string
  amount: string
  due_date: string
  title: string
  description: string
  period_month: string
  period_year: string
}

export const Route = createFileRoute('/dashboard/spp')({
  component: SPPPage,
})

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function firstValidationMessage(errors?: Record<string, string[]>): string | null {
  if (!errors) {
    return null
  }

  for (const messages of Object.values(errors)) {
    if (messages.length > 0) {
      return messages[0]
    }
  }

  return null
}

function parseStudentIds(raw: string): string[] | undefined {
  const parsed = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return parsed.length > 0 ? parsed : undefined
}

const statusConfig: Record<BillStatus, { label: string; color: 'success' | 'warning' | 'danger' | 'default' }> = {
  paid: { label: 'Lunas', color: 'success' },
  partial: { label: 'Sebagian', color: 'warning' },
  unpaid: { label: 'Belum Bayar', color: 'danger' },
  void: { label: 'Void', color: 'default' },
}

function SPPPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | BillStatus>('all')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const generateSppModalState = useOverlayState()
  const generateFeeModalState = useOverlayState()

  const { data, isLoading, error } = useBills({
    per_page: 100,
    status: filterStatus === 'all' ? undefined : filterStatus,
  })
  const { data: feeTypesData } = useFeeTypes({ per_page: 100 })
  const generateSpp = useGenerateSpp()
  const generateFee = useGenerateFee()

  const now = new Date()

  const generateSppForm = useForm<GenerateSppFormValues>({
    defaultValues: {
      rombongan_belajar_id: '',
      period_month: String(now.getMonth() + 1),
      period_year: String(now.getFullYear()),
      amount: '',
      due_date: '',
      title: '',
      description: '',
      student_ids: '',
    },
  })

  const generateFeeForm = useForm<GenerateFeeFormValues>({
    defaultValues: {
      finance_fee_type_id: '',
      student_ids: '',
      amount: '',
      due_date: '',
      title: '',
      description: '',
      period_month: '',
      period_year: '',
    },
  })

  const bills = data?.data ?? []
  const feeTypes = (feeTypesData?.data ?? []).filter((item) => item.is_active)

  const filteredBills = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return bills.filter((bill) => {
      if (!query) {
        return true
      }

      return (
        bill.bill_number.toLowerCase().includes(query) ||
        bill.student?.fullname.toLowerCase().includes(query) ||
        bill.student?.nipd?.toLowerCase().includes(query) ||
        bill.student?.nisn?.toLowerCase().includes(query) ||
        bill.title.toLowerCase().includes(query)
      )
    })
  }, [bills, searchQuery])

  useEffect(() => {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }))
  }, [searchQuery, filterStatus])

  const table = useReactTable({
    data: filteredBills,
    columns: useMemo(() => [{ accessorKey: 'id' }], []),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const paginatedBills = table.getRowModel().rows.map((row) => row.original)

  const paidCount = bills.filter((bill) => bill.status === 'paid').length
  const partialCount = bills.filter((bill) => bill.status === 'partial').length
  const unpaidCount = bills.filter((bill) => bill.status === 'unpaid').length

  const submitGenerateSpp = generateSppForm.handleSubmit(async (values) => {
    const month = Number(values.period_month)
    const year = Number(values.period_year)
    const amount = Number(values.amount)

    if (!Number.isFinite(month) || month < 1 || month > 12) {
      generateSppForm.setError('period_month', {
        message: 'Bulan harus 1 sampai 12',
      })
      return
    }

    if (!Number.isFinite(year) || year < 2000) {
      generateSppForm.setError('period_year', {
        message: 'Tahun tidak valid',
      })
      return
    }

    if (!Number.isFinite(amount) || amount < 1) {
      generateSppForm.setError('amount', {
        message: 'Nominal harus lebih dari 0',
      })
      return
    }

    try {
      const response = await generateSpp.mutateAsync({
        rombongan_belajar_id: values.rombongan_belajar_id,
        period_month: month,
        period_year: year,
        amount,
        due_date: values.due_date || undefined,
        title: values.title || undefined,
        description: values.description || undefined,
        student_ids: parseStudentIds(values.student_ids),
      })

      toast.success(
        `Generate SPP selesai. Dibuat ${response.created_count}, dilewati ${response.skipped_count}.`,
      )
      generateSppModalState.close()
      generateSppForm.reset({
        ...generateSppForm.getValues(),
        amount: '',
        due_date: '',
        title: '',
        description: '',
        student_ids: '',
      })
    } catch (err) {
      if (err instanceof ApiResponseError) {
        const message = firstValidationMessage(err.errors) ?? err.message
        toast.danger(message)
      } else {
        toast.danger('Gagal membuat tagihan SPP.')
      }
    }
  })

  const submitGenerateFee = generateFeeForm.handleSubmit(async (values) => {
    const feeTypeId = Number(values.finance_fee_type_id)
    const amount = Number(values.amount)
    const month = values.period_month ? Number(values.period_month) : undefined
    const year = values.period_year ? Number(values.period_year) : undefined
    const studentIds = parseStudentIds(values.student_ids)

    if (!Number.isFinite(feeTypeId) || feeTypeId < 1) {
      generateFeeForm.setError('finance_fee_type_id', {
        message: 'Jenis tagihan wajib dipilih',
      })
      return
    }

    if (!studentIds || studentIds.length === 0) {
      generateFeeForm.setError('student_ids', {
        message: 'Isi minimal satu Student UUID',
      })
      return
    }

    if (!Number.isFinite(amount) || amount < 1) {
      generateFeeForm.setError('amount', {
        message: 'Nominal harus lebih dari 0',
      })
      return
    }

    if (month && (month < 1 || month > 12)) {
      generateFeeForm.setError('period_month', {
        message: 'Bulan harus 1 sampai 12',
      })
      return
    }

    if (year && year < 2000) {
      generateFeeForm.setError('period_year', {
        message: 'Tahun tidak valid',
      })
      return
    }

    try {
      const response = await generateFee.mutateAsync({
        finance_fee_type_id: feeTypeId,
        student_ids: studentIds,
        amount,
        due_date: values.due_date || undefined,
        title: values.title,
        description: values.description || undefined,
        period_month: month,
        period_year: year,
      })

      toast.success(`Tagihan lainnya berhasil dibuat (${response.created_count} tagihan).`)
      generateFeeModalState.close()
      generateFeeForm.reset({
        finance_fee_type_id: '',
        student_ids: '',
        amount: '',
        due_date: '',
        title: '',
        description: '',
        period_month: '',
        period_year: '',
      })
    } catch (err) {
      if (err instanceof ApiResponseError) {
        const message = firstValidationMessage(err.errors) ?? err.message
        toast.danger(message)
      } else {
        toast.danger('Gagal membuat tagihan lainnya.')
      }
    }
  })

  if (isLoading) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="max-w-xl mx-auto border border-danger/20 bg-danger/5">
        <Card.Content className="p-6">
          <p className="text-danger font-medium">Gagal memuat data tagihan.</p>
          <p className="text-sm text-default-500 mt-1">Silakan coba lagi dalam beberapa saat.</p>
        </Card.Content>
      </Card>
    )
  }

  return (
    <div className={pageShellClass}>
      <div className={pageHeaderClass}>
        <div>
          <h1 className="text-2xl font-semibold">Tagihan SPP</h1>
          <p className="text-sm text-default-500 mt-1">Daftar tagihan dan pembuatan tagihan bulanan siswa.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="secondary"
            className="border border-border/70"
            onPress={generateFeeModalState.open}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tagihan Lain
          </Button>
          <Button variant="primary" className="bg-accent text-accent-foreground" onPress={generateSppModalState.open}>
            <Plus className="w-4 h-4 mr-2" />
            Generate SPP
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={surfaceCardClass}>
          <Card.Content className="p-4 text-center">
            <p className="text-xs text-default-500">Lunas</p>
            <p className="text-2xl font-semibold text-success mt-1">{paidCount}</p>
          </Card.Content>
        </Card>
        <Card className={surfaceCardClass}>
          <Card.Content className="p-4 text-center">
            <p className="text-xs text-default-500">Sebagian</p>
            <p className="text-2xl font-semibold text-warning mt-1">{partialCount}</p>
          </Card.Content>
        </Card>
        <Card className={surfaceCardClass}>
          <Card.Content className="p-4 text-center">
            <p className="text-xs text-default-500">Belum Bayar</p>
            <p className="text-2xl font-semibold text-danger mt-1">{unpaidCount}</p>
          </Card.Content>
        </Card>
      </div>

      <Card className={surfaceCardClass}>
        <Card.Header className={cardHeaderClass}>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="flex-1">
              <TextField fullWidth>
                <Input
                  aria-label="Cari tagihan"
                  placeholder="Cari nomor tagihan, nama siswa, NIPD/NISN, atau judul"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </TextField>
            </div>

            <div className="w-full sm:w-[220px]">
              <Select
                aria-label="Filter status tagihan"
                selectedKey={filterStatus}
                onSelectionChange={(key) =>
                  setFilterStatus((key ?? 'all') as 'all' | BillStatus)
                }
                fullWidth
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="all" textValue="Semua status">Semua status</ListBox.Item>
                    <ListBox.Item id="unpaid" textValue="Belum bayar">Belum bayar</ListBox.Item>
                    <ListBox.Item id="partial" textValue="Sebagian">Sebagian</ListBox.Item>
                    <ListBox.Item id="paid" textValue="Lunas">Lunas</ListBox.Item>
                    <ListBox.Item id="void" textValue="Void">Void</ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </div>
        </Card.Header>

        <Card.Content className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-border/70">
                  <th className={tableHeadCellClass}>Nomor Tagihan</th>
                  <th className={tableHeadCellClass}>Siswa</th>
                  <th className={tableHeadCellClass}>Periode</th>
                  <th className={tableHeadCellClass}>Netto</th>
                  <th className={`${tableHeadCellClass} hidden md:table-cell`}>Sisa</th>
                  <th className={tableHeadCellClass}>Status</th>
                  <th className={tableHeadCellClass}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBills.map((bill) => (
                  <tr key={bill.id} className="border-t border-border/50 hover:bg-surface/60 transition-colors">
                    <td className={tableBodyCellClass}>
                      <div>
                        <p className="font-mono text-xs">{bill.bill_number}</p>
                        <p className="text-xs text-default-500 mt-0.5">{bill.title}</p>
                      </div>
                    </td>
                    <td className={tableBodyCellClass}>
                      <div>
                        <p className="font-medium text-default-700">{bill.student?.fullname ?? 'Unknown Student'}</p>
                        <p className="text-xs text-default-500 mt-0.5">
                          {bill.student?.nipd || bill.student?.nisn || '-'}
                        </p>
                      </div>
                    </td>
                    <td className={tableBodyCellClass}>
                      {bill.period_month && bill.period_year ? `${bill.period_month}/${bill.period_year}` : '-'}
                    </td>
                    <td className={`${tableBodyCellClass} font-semibold`}>{formatCurrency(bill.amount_net)}</td>
                    <td className={`${tableBodyCellClass} hidden md:table-cell`}>{formatCurrency(bill.amount_outstanding)}</td>
                    <td className={tableBodyCellClass}>
                      <Chip size="sm" variant="soft" color={statusConfig[bill.status].color}>
                        <Chip.Label>{statusConfig[bill.status].label}</Chip.Label>
                      </Chip>
                    </td>
                    <td className={tableBodyCellClass}>
                      <Link
                        to="/dashboard/student-bills"
                        search={{ student_id: bill.student_id }}
                      >
                        <Button size="sm" variant="ghost" isIconOnly aria-label="Lihat tagihan siswa">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBills.length === 0 && (
            <div className="py-10 text-center text-sm text-default-500">Tidak ada data tagihan ditemukan.</div>
          )}

          <TablePagination
            pageIndex={pagination.pageIndex}
            pageCount={table.getPageCount()}
            pageSize={pagination.pageSize}
            totalRows={filteredBills.length}
            visibleRows={paginatedBills.length}
            canPreviousPage={table.getCanPreviousPage()}
            canNextPage={table.getCanNextPage()}
            onPreviousPage={() => table.previousPage()}
            onNextPage={() => table.nextPage()}
          />
        </Card.Content>
      </Card>

      <Modal state={generateSppModalState}>
        <Modal.Backdrop>
          <Modal.Container size="lg" placement="center">
            <Modal.Dialog aria-label="Generate Tagihan SPP">
              <form onSubmit={submitGenerateSpp}>
                <Modal.Header>
                  <Modal.Heading>Generate Tagihan SPP</Modal.Heading>
                  <Modal.CloseTrigger />
                </Modal.Header>
                <Modal.Body className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-default-500 mb-1">Rombongan Belajar ID</p>
                      <Controller
                        control={generateSppForm.control}
                        name="rombongan_belajar_id"
                        rules={{ required: 'Rombongan belajar wajib diisi' }}
                        render={({ field }) => (
                          <TextField fullWidth>
                            <Input
                              aria-label="Rombongan Belajar ID"
                              placeholder="UUID rombel"
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </TextField>
                        )}
                      />
                      {generateSppForm.formState.errors.rombongan_belajar_id && (
                        <p className="text-xs text-danger mt-1">{generateSppForm.formState.errors.rombongan_belajar_id.message}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-default-500 mb-1">Nominal Tagihan</p>
                      <Controller
                        control={generateSppForm.control}
                        name="amount"
                        rules={{ required: 'Nominal wajib diisi' }}
                        render={({ field }) => (
                          <TextField fullWidth>
                            <Input
                              aria-label="Nominal tagihan"
                              type="number"
                              min={1}
                              placeholder="500000"
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </TextField>
                        )}
                      />
                      {generateSppForm.formState.errors.amount && (
                        <p className="text-xs text-danger mt-1">{generateSppForm.formState.errors.amount.message}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-default-500 mb-1">Bulan Periode (1-12)</p>
                      <Controller
                        control={generateSppForm.control}
                        name="period_month"
                        rules={{ required: 'Bulan wajib diisi' }}
                        render={({ field }) => (
                          <TextField fullWidth>
                            <Input
                              aria-label="Bulan periode"
                              type="number"
                              min={1}
                              max={12}
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </TextField>
                        )}
                      />
                      {generateSppForm.formState.errors.period_month && (
                        <p className="text-xs text-danger mt-1">{generateSppForm.formState.errors.period_month.message}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-default-500 mb-1">Tahun Periode</p>
                      <Controller
                        control={generateSppForm.control}
                        name="period_year"
                        rules={{ required: 'Tahun wajib diisi' }}
                        render={({ field }) => (
                          <TextField fullWidth>
                            <Input
                              aria-label="Tahun periode"
                              type="number"
                              min={2000}
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </TextField>
                        )}
                      />
                      {generateSppForm.formState.errors.period_year && (
                        <p className="text-xs text-danger mt-1">{generateSppForm.formState.errors.period_year.message}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs text-default-500 mb-1">Jatuh Tempo (opsional)</p>
                      <Controller
                        control={generateSppForm.control}
                        name="due_date"
                        render={({ field }) => (
                          <TextField fullWidth>
                            <Input
                              aria-label="Jatuh tempo"
                              type="date"
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </TextField>
                        )}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs text-default-500 mb-1">Judul Tagihan (opsional)</p>
                      <Controller
                        control={generateSppForm.control}
                        name="title"
                        render={({ field }) => (
                          <TextField fullWidth>
                            <Input
                              aria-label="Judul tagihan"
                              placeholder="SPP Februari 2026"
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </TextField>
                        )}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs text-default-500 mb-1">Student UUID (opsional, pisahkan koma)</p>
                      <Controller
                        control={generateSppForm.control}
                        name="student_ids"
                        render={({ field }) => (
                          <TextField fullWidth>
                            <Input
                              aria-label="Student UUID"
                              placeholder="uuid-1, uuid-2"
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </TextField>
                        )}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs text-default-500 mb-1">Deskripsi (opsional)</p>
                      <Controller
                        control={generateSppForm.control}
                        name="description"
                        render={({ field }) => (
                          <TextArea
                            aria-label="Deskripsi"
                            placeholder="Keterangan tambahan"
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        )}
                      />
                    </div>
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onPress={generateSppModalState.close} type="button">
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    className="bg-accent text-accent-foreground"
                    type="submit"
                    isDisabled={generateSpp.isPending}
                  >
                    {generateSpp.isPending ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={generateFeeModalState}>
        <Modal.Backdrop>
          <Modal.Container size="lg" placement="center">
            <Modal.Dialog aria-label="Generate Tagihan Lainnya">
              <form onSubmit={submitGenerateFee}>
                <Modal.Header>
                  <Modal.Heading>Generate Tagihan Lainnya</Modal.Heading>
                  <Modal.CloseTrigger />
                </Modal.Header>
                <Modal.Body className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <p className="text-xs text-default-500 mb-1">Jenis Tagihan</p>
                      <Controller
                        control={generateFeeForm.control}
                        name="finance_fee_type_id"
                        rules={{ required: 'Jenis tagihan wajib dipilih' }}
                        render={({ field }) => (
                          <Select
                            aria-label="Jenis tagihan"
                            selectedKey={field.value || null}
                            onSelectionChange={(key) => field.onChange(String(key ?? ''))}
                            fullWidth
                          >
                            <Select.Trigger>
                              <Select.Value />
                              <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                              <ListBox>
                                {feeTypes.map((feeType) => (
                                  <ListBox.Item key={feeType.id} id={String(feeType.id)} textValue={feeType.name}>
                                    {feeType.name}
                                  </ListBox.Item>
                                ))}
                              </ListBox>
                            </Select.Popover>
                          </Select>
                        )}
                      />
                      {generateFeeForm.formState.errors.finance_fee_type_id && (
                        <p className="text-xs text-danger mt-1">{generateFeeForm.formState.errors.finance_fee_type_id.message}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs text-default-500 mb-1">Student UUID (pisahkan koma)</p>
                      <Controller
                        control={generateFeeForm.control}
                        name="student_ids"
                        rules={{ required: 'Student UUID wajib diisi' }}
                        render={({ field }) => (
                          <TextField fullWidth>
                            <Input
                              aria-label="Student UUID"
                              placeholder="uuid-1, uuid-2"
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </TextField>
                        )}
                      />
                      {generateFeeForm.formState.errors.student_ids && (
                        <p className="text-xs text-danger mt-1">{generateFeeForm.formState.errors.student_ids.message}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-default-500 mb-1">Nominal</p>
                      <Controller
                        control={generateFeeForm.control}
                        name="amount"
                        rules={{ required: 'Nominal wajib diisi' }}
                        render={({ field }) => (
                          <TextField fullWidth>
                            <Input
                              aria-label="Nominal"
                              type="number"
                              min={1}
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </TextField>
                        )}
                      />
                      {generateFeeForm.formState.errors.amount && (
                        <p className="text-xs text-danger mt-1">{generateFeeForm.formState.errors.amount.message}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-default-500 mb-1">Jatuh Tempo</p>
                      <Controller
                        control={generateFeeForm.control}
                        name="due_date"
                        rules={{ required: 'Jatuh tempo wajib diisi' }}
                        render={({ field }) => (
                          <TextField fullWidth>
                            <Input
                              aria-label="Jatuh tempo"
                              type="date"
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </TextField>
                        )}
                      />
                      {generateFeeForm.formState.errors.due_date && (
                        <p className="text-xs text-danger mt-1">{generateFeeForm.formState.errors.due_date.message}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs text-default-500 mb-1">Judul Tagihan</p>
                      <Controller
                        control={generateFeeForm.control}
                        name="title"
                        rules={{ required: 'Judul wajib diisi' }}
                        render={({ field }) => (
                          <TextField fullWidth>
                            <Input
                              aria-label="Judul"
                              placeholder="Biaya kegiatan semester"
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </TextField>
                        )}
                      />
                      {generateFeeForm.formState.errors.title && (
                        <p className="text-xs text-danger mt-1">{generateFeeForm.formState.errors.title.message}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-default-500 mb-1">Bulan Periode (opsional)</p>
                      <Controller
                        control={generateFeeForm.control}
                        name="period_month"
                        render={({ field }) => (
                          <TextField fullWidth>
                            <Input
                              aria-label="Bulan periode"
                              type="number"
                              min={1}
                              max={12}
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </TextField>
                        )}
                      />
                    </div>

                    <div>
                      <p className="text-xs text-default-500 mb-1">Tahun Periode (opsional)</p>
                      <Controller
                        control={generateFeeForm.control}
                        name="period_year"
                        render={({ field }) => (
                          <TextField fullWidth>
                            <Input
                              aria-label="Tahun periode"
                              type="number"
                              min={2000}
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </TextField>
                        )}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs text-default-500 mb-1">Deskripsi (opsional)</p>
                      <Controller
                        control={generateFeeForm.control}
                        name="description"
                        render={({ field }) => (
                          <TextArea
                            aria-label="Deskripsi"
                            placeholder="Keterangan tambahan"
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        )}
                      />
                    </div>
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onPress={generateFeeModalState.close} type="button">
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    className="bg-accent text-accent-foreground"
                    type="submit"
                    isDisabled={generateFee.isPending}
                  >
                    {generateFee.isPending ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  )
}
