import {
  Button,
  ComboBox,
  Input,
  ListBox,
  Modal,
  Spinner,
  TextArea,
  TextField,
  toast,
  useOverlayState,
} from '@heroui/react'
import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { StudentSearchSelect } from '@/components/shared/student-search-select'
import { useGenerateSpp } from '@/hooks/use-bills'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useRefRombels } from '@/hooks/use-references'
import { ApiResponseError } from '@/lib/api-client'
import { firstValidationMessage } from '@/lib/format'
import type { Rombel } from '@/types/finance'

export interface GenerateSppFormValues {
  rombongan_belajar_id: string
  period_month: string
  period_year: string
  amount: string
  due_date: string
  title: string
  description: string
  student_ids: string[]
}

interface GenerateSppModalProps {
  state: ReturnType<typeof useOverlayState>
}

const MIN_ROMBEL_SEARCH_LENGTH = 2

function getRombelId(rombel: Rombel): string {
  return rombel.rombongan_belajar_id ?? rombel.id
}

function rombelLabel(rombel: Rombel): string {
  if (rombel.nama && rombel.nama.trim().length > 0) {
    return rombel.nama
  }

  if (rombel.name && rombel.name.trim().length > 0) {
    return rombel.name
  }

  if (rombel.code && rombel.code.trim().length > 0) {
    return rombel.code
  }

  return getRombelId(rombel)
}

function rombelSubtitle(rombel: Rombel): string {
  const parts: string[] = []

  if (rombel.tingkat_kelas) {
    parts.push(`Kelas ${rombel.tingkat_kelas}`)
  }

  if (rombel.jurusan?.name) {
    parts.push(rombel.jurusan.name)
  } else if (rombel.jurusan?.nama) {
    parts.push(rombel.jurusan.nama)
  }

  if (rombel.tahun_ajaran?.name) {
    parts.push(rombel.tahun_ajaran.name)
  } else if (rombel.tahun_ajaran?.nama) {
    parts.push(rombel.tahun_ajaran.nama)
  }

  return parts.join(' | ')
}

export function GenerateSppModal({ state }: GenerateSppModalProps) {
  const generateSpp = useGenerateSpp()
  const now = new Date()
  const form = useForm<GenerateSppFormValues>({
    defaultValues: {
      rombongan_belajar_id: '',
      period_month: String(now.getMonth() + 1),
      period_year: String(now.getFullYear()),
      amount: '',
      due_date: '',
      title: '',
      description: '',
      student_ids: [],
    },
  })
  const [rombelSearchValue, setRombelSearchValue] = useState('')
  const [rombelCache, setRombelCache] = useState<Record<string, Rombel>>({})
  const debouncedRombelSearchValue = useDebouncedValue(rombelSearchValue.trim(), 300)

  const shouldQueryRombels = debouncedRombelSearchValue.length >= MIN_ROMBEL_SEARCH_LENGTH

  const { data: rombelsData, isFetching: rombelsLoading } = useRefRombels(
    {
      search: shouldQueryRombels ? debouncedRombelSearchValue : undefined,
      active_only: true,
      per_page: 15,
    },
    { enabled: shouldQueryRombels },
  )

  const rombels = rombelsData?.data ?? []

  useEffect(() => {
    if (rombels.length === 0) {
      return
    }

    setRombelCache((previous) => {
      const next = { ...previous }
      for (const rombel of rombels) {
        next[getRombelId(rombel)] = rombel
      }
      return next
    })
  }, [rombels])

  const selectedRombelId = form.watch('rombongan_belajar_id')
  const selectedRombel = useMemo(
    () => (selectedRombelId ? rombelCache[selectedRombelId] ?? null : null),
    [rombelCache, selectedRombelId],
  )

  const submit = form.handleSubmit(async (values) => {
    const month = Number(values.period_month)
    const year = Number(values.period_year)
    const amount = Number(values.amount)

    if (!Number.isFinite(month) || month < 1 || month > 12) {
      form.setError('period_month', { message: 'Bulan harus 1 sampai 12' })
      return
    }

    if (!Number.isFinite(year) || year < 2000) {
      form.setError('period_year', { message: 'Tahun tidak valid' })
      return
    }

    if (!Number.isFinite(amount) || amount < 1) {
      form.setError('amount', { message: 'Nominal harus lebih dari 0' })
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
        student_ids: values.student_ids.length > 0 ? values.student_ids : undefined,
      })

      toast.success(`Generate SPP selesai. Dibuat ${response.created_count}, dilewati ${response.skipped_count}.`)
      state.close()
      form.reset({
        ...form.getValues(),
        amount: '',
        due_date: '',
        title: '',
        description: '',
        student_ids: [],
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

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog aria-label="Generate Tagihan SPP">
            <form onSubmit={submit}>
              <Modal.Header>
                <Modal.Heading>Generate Tagihan SPP</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <p className="text-xs text-default-500 mb-1">Rombongan Belajar</p>
                    <Controller
                      control={form.control}
                      name="rombongan_belajar_id"
                      rules={{ required: 'Rombongan belajar wajib diisi' }}
                      render={({ field }) => (
                        <div className="space-y-2">
                          <ComboBox
                            aria-label="Cari rombongan belajar"
                            selectedKey={null}
                            onSelectionChange={(key) => {
                              if (!key) {
                                return
                              }

                              const rombelId = String(key)
                              field.onChange(rombelId)
                              form.setValue('student_ids', [])
                              setRombelSearchValue('')
                            }}
                            inputValue={rombelSearchValue}
                            onInputChange={setRombelSearchValue}
                            allowsEmptyCollection
                            menuTrigger="input"
                            fullWidth
                          >
                            <ComboBox.InputGroup>
                              <Input placeholder="Cari nama atau kode rombel" />
                              <ComboBox.Trigger />
                            </ComboBox.InputGroup>
                            <ComboBox.Popover>
                              <ListBox
                                aria-label="Hasil pencarian rombel"
                                renderEmptyState={() => (
                                  <div className="px-3 py-2 text-xs text-default-500">
                                    {!shouldQueryRombels
                                      ? `Ketik minimal ${MIN_ROMBEL_SEARCH_LENGTH} karakter`
                                      : rombelsLoading
                                        ? 'Mencari rombel...'
                                        : 'Rombel tidak ditemukan'}
                                  </div>
                                )}
                              >
                                {rombels.map((rombel) => {
                                  const rombelId = getRombelId(rombel)
                                  const subtitle = rombelSubtitle(rombel)
                                  return (
                                    <ListBox.Item
                                      key={rombelId}
                                      id={rombelId}
                                      textValue={`${rombelLabel(rombel)} ${subtitle}`}
                                      isDisabled={field.value === rombelId}
                                    >
                                      <div className="flex flex-col">
                                        <span className="text-sm text-foreground">{rombelLabel(rombel)}</span>
                                        {subtitle && (
                                          <span className="text-xs text-default-500">{subtitle}</span>
                                        )}
                                      </div>
                                    </ListBox.Item>
                                  )
                                })}
                              </ListBox>
                            </ComboBox.Popover>
                          </ComboBox>

                          {rombelsLoading && shouldQueryRombels && (
                            <div className="flex items-center gap-2 text-xs text-default-500">
                              <Spinner size="sm" />
                              Memuat data rombel...
                            </div>
                          )}

                          {field.value && (
                            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-1">
                              <span className="text-xs text-foreground">
                                {selectedRombel ? rombelLabel(selectedRombel) : field.value}
                              </span>
                              {selectedRombel && rombelSubtitle(selectedRombel) && (
                                <span className="text-xs text-default-500">{rombelSubtitle(selectedRombel)}</span>
                              )}
                              <Button
                                size="sm"
                                isIconOnly
                                variant="ghost"
                                className="h-5 w-5 min-w-0"
                                aria-label="Hapus rombel terpilih"
                                onPress={() => {
                                  field.onChange('')
                                  form.setValue('student_ids', [])
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    />
                    {form.formState.errors.rombongan_belajar_id && (
                      <p className="text-xs text-danger mt-1">{form.formState.errors.rombongan_belajar_id.message}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-default-500 mb-1">Nominal Tagihan</p>
                    <Controller
                      control={form.control}
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
                    {form.formState.errors.amount && <p className="text-xs text-danger mt-1">{form.formState.errors.amount.message}</p>}
                  </div>

                  <div>
                    <p className="text-xs text-default-500 mb-1">Bulan Periode (1-12)</p>
                    <Controller
                      control={form.control}
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
                    {form.formState.errors.period_month && (
                      <p className="text-xs text-danger mt-1">{form.formState.errors.period_month.message}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-default-500 mb-1">Tahun Periode</p>
                    <Controller
                      control={form.control}
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
                    {form.formState.errors.period_year && (
                      <p className="text-xs text-danger mt-1">{form.formState.errors.period_year.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-default-500 mb-1">Jatuh Tempo (opsional)</p>
                    <Controller
                      control={form.control}
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
                      control={form.control}
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
                    <p className="text-xs text-default-500 mb-1">Siswa (opsional)</p>
                    <Controller
                      control={form.control}
                      name="student_ids"
                      render={({ field }) => (
                        <StudentSearchSelect
                          value={field.value}
                          onChange={field.onChange}
                          rombonganBelajarId={selectedRombelId || undefined}
                          isDisabled={!selectedRombelId}
                        />
                      )}
                    />
                    {!selectedRombelId && (
                      <p className="text-xs text-default-500 mt-1">Pilih rombel terlebih dahulu untuk mencari siswa.</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-default-500 mb-1">Deskripsi (opsional)</p>
                    <Controller
                      control={form.control}
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
                <Button variant="secondary" onPress={state.close} type="button">
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
  )
}
