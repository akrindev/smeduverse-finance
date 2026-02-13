import { Button, Chip, Modal, Separator, useOverlayState, Spinner } from '@heroui/react'
import { X, User, GraduationCap, Calendar, Info, BadgePercent } from 'lucide-react'
import type { Student } from '@/types/finance'
import { tableBodyCellClass, tableHeadCellClass } from '@/lib/page-styles'
import { getRombelLabel } from '@/lib/tagihan-siswa'
import { useStudentScholarships } from '@/hooks/use-scholarships'
import { formatCurrency } from '@/lib/format'

interface StudentDetailModalProps {
  student: Student | null
  state: ReturnType<typeof useOverlayState>
}

export function StudentDetailModal({ student, state }: StudentDetailModalProps) {
  const { data: scholarshipsData, isLoading: scholarshipsLoading } = useStudentScholarships(
    student?.student_id || '',
    { enabled: state.isOpen && !!student?.student_id }
  )

  if (!student) return null

  const rombelHistory = student.rombongan_belajar ?? []
  const assignedScholarships = scholarshipsData?.data ?? []

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog aria-label="Detail Siswa">
            <Modal.Header>
              <div className="flex-1">
                <Modal.Heading>Detail Siswa</Modal.Heading>
                <p className="text-xs text-default-500 mt-1">Informasi lengkap, riwayat rombel, dan beasiswa</p>
              </div>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{student.fullname}</p>
                      <p className="text-sm text-default-500 uppercase">
                        {student.jenis_kelamin === 'p' ? 'Perempuan' : 'Laki-laki'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-default-500 font-medium uppercase tracking-wider">NIPD</p>
                      <p className="text-sm font-medium">{student.nipd || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-default-500 font-medium uppercase tracking-wider">NISN</p>
                      <p className="text-sm font-medium">{student.nisn || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BadgePercent className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold">Riwayat Beasiswa</h3>
                </div>

                {scholarshipsLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner size="sm" />
                  </div>
                ) : (
                  <div className="border border-border/50 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-surface/50">
                            <th className={tableHeadCellClass}>Program</th>
                            <th className={tableHeadCellClass}>Potongan</th>
                            <th className={tableHeadCellClass}>Semester/Tahun</th>
                            <th className={tableHeadCellClass}>Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {assignedScholarships.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-default-500">
                                Belum ada beasiswa yang diberikan.
                              </td>
                            </tr>
                          ) : (
                            assignedScholarships.map((as) => (
                              <tr key={as.id} className="hover:bg-surface/30 transition-colors">
                                <td className={tableBodyCellClass}>
                                  <p className="font-semibold">{as.scholarship?.name}</p>
                                  <p className="text-[10px] text-default-500 font-mono">{as.scholarship?.code}</p>
                                </td>
                                <td className={tableBodyCellClass}>
                                  <p className="font-medium text-success">
                                    {as.scholarship?.discount_type === 'percent'
                                      ? `${as.scholarship.discount_value}%`
                                      : formatCurrency(as.scholarship?.discount_value || 0)}
                                  </p>
                                  <p className="text-[10px] text-default-500">
                                    {as.scholarship?.fee_type?.name || 'Semua biaya'}
                                  </p>
                                </td>
                                <td className={tableBodyCellClass}>
                                  <p>{as.semester?.nama || as.semester?.name || '-'}</p>
                                  <p className="text-[10px] text-default-500">
                                    {as.tahun_ajaran?.nama || as.tahun_ajaran?.name || '-'}
                                  </p>
                                </td>
                                <td className={tableBodyCellClass}>
                                  <Chip
                                    size="sm"
                                    variant="soft"
                                    color={as.is_active ? 'success' : 'default'}
                                  >
                                    {as.is_active ? 'Aktif' : 'Non-aktif'}
                                  </Chip>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold">Riwayat Rombongan Belajar</h3>
                </div>

                <div className="border border-border/50 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface/50">
                          <th className={tableHeadCellClass}>Rombel</th>
                          <th className={tableHeadCellClass}>Tahun Ajaran</th>
                          <th className={tableHeadCellClass}>Tgl Masuk</th>
                          <th className={tableHeadCellClass}>Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {rombelHistory.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-default-500">
                              Tidak ada data riwayat rombel.
                            </td>
                          </tr>
                        ) : (
                          rombelHistory.map((rombel) => (
                            <tr key={rombel.id} className="hover:bg-surface/30 transition-colors">
                              <td className={tableBodyCellClass}>
                                <p className="font-semibold">{getRombelLabel(rombel)}</p>
                                <p className="text-[10px] text-default-500">
                                  {rombel.tingkat_kelas} - {rombel.jurusan?.name || rombel.jurusan?.nama || '-'}
                                </p>
                              </td>
                              <td className={tableBodyCellClass}>
                                {rombel.tahun_ajaran?.nama || rombel.tahun_ajaran?.name || '-'}
                              </td>
                              <td className={tableBodyCellClass}>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-default-400" />
                                  <span>{rombel.pivot?.tanggal_masuk || '-'}</span>
                                </div>
                              </td>
                              <td className={tableBodyCellClass}>
                                {(() => {
                                  const status = Number(rombel.pivot?.status)
                                  if (status === 1) {
                                    return (
                                      <Chip size="sm" variant="soft" color="success">
                                        Aktif
                                      </Chip>
                                    )
                                  }
                                  if (status === 2) {
                                    return (
                                      <Chip size="sm" variant="soft" color="accent">
                                        Lulus
                                      </Chip>
                                    )
                                  }
                                  return (
                                    <Chip size="sm" variant="soft" color="default">
                                      Tidak Aktif
                                    </Chip>
                                  )
                                })()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {student.rombel_aktif && student.rombel_aktif.length > 0 && (
                <div className="bg-accent/5 p-4 rounded-2xl border border-accent/10">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-accent">Rombel Aktif Saat Ini</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {student.rombel_aktif.map((r) => (
                          <Chip key={r.id} size="sm" variant="soft" color="accent" className="text-accent">
                            {getRombelLabel(r)}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button variant="secondary" onPress={state.close}>
                <X className="w-4 h-4 mr-2" />
                Tutup
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
