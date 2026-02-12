import { describe, expect, it } from 'vitest'
import type { Bill, Rombel } from '@/types/finance'
import {
  buildClassMetricsMap,
  sortRombelsByJenjang,
  validatePaymentAmount,
} from './tagihan-siswa'

describe('sortRombelsByJenjang', () => {
  it('sorts by numeric tingkat_kelas then class name', () => {
    const input: Rombel[] = [
      { id: 'c', nama: 'XI TKJ', tingkat_kelas: 11 },
      { id: 'a', nama: 'X ACP', tingkat_kelas: 10 },
      { id: 'b', nama: 'X AT', tingkat_kelas: 10 },
    ]

    const result = sortRombelsByJenjang(input)

    expect(result.map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('buildClassMetricsMap', () => {
  it('aggregates bill totals by rombongan_belajar_id', () => {
    const bills = [
      {
        id: 1,
        bill_number: 'B1',
        student_id: 's1',
        rombongan_belajar_id: 'r1',
        semester_id: 1,
        tahun_ajaran_id: 1,
        finance_fee_type_id: 1,
        finance_student_scholarship_id: null,
        period_month: null,
        period_year: null,
        title: 'T1',
        description: null,
        amount_gross: 100,
        amount_discount: 0,
        amount_net: 100,
        amount_paid: 25,
        amount_outstanding: 75,
        due_date: null,
        status: 'partial',
        issued_at: null,
        paid_off_at: null,
        voided_at: null,
        fee_type: null,
        student_scholarship: null,
        student: null,
        allocations: [],
        created_at: '',
        updated_at: '',
      },
      {
        id: 2,
        bill_number: 'B2',
        student_id: 's2',
        rombongan_belajar_id: 'r1',
        semester_id: 1,
        tahun_ajaran_id: 1,
        finance_fee_type_id: 1,
        finance_student_scholarship_id: null,
        period_month: null,
        period_year: null,
        title: 'T2',
        description: null,
        amount_gross: 200,
        amount_discount: 0,
        amount_net: 200,
        amount_paid: 100,
        amount_outstanding: 100,
        due_date: null,
        status: 'partial',
        issued_at: null,
        paid_off_at: null,
        voided_at: null,
        fee_type: null,
        student_scholarship: null,
        student: null,
        allocations: [],
        created_at: '',
        updated_at: '',
      },
      {
        id: 3,
        bill_number: 'B3',
        student_id: 's3',
        rombongan_belajar_id: 'r2',
        semester_id: 1,
        tahun_ajaran_id: 1,
        finance_fee_type_id: 1,
        finance_student_scholarship_id: null,
        period_month: null,
        period_year: null,
        title: 'T3',
        description: null,
        amount_gross: 300,
        amount_discount: 0,
        amount_net: 300,
        amount_paid: 0,
        amount_outstanding: 300,
        due_date: null,
        status: 'unpaid',
        issued_at: null,
        paid_off_at: null,
        voided_at: null,
        fee_type: null,
        student_scholarship: null,
        student: null,
        allocations: [],
        created_at: '',
        updated_at: '',
      },
    ] satisfies Bill[]

    const result = buildClassMetricsMap(bills)

    expect(result.get('r1')).toEqual({
      totalBills: 2,
      totalNet: 300,
      totalPaid: 125,
      totalOutstanding: 175,
    })

    expect(result.get('r2')).toEqual({
      totalBills: 1,
      totalNet: 300,
      totalPaid: 0,
      totalOutstanding: 300,
    })
  })
})

describe('validatePaymentAmount', () => {
  it('returns error for invalid, zero, and overflow values', () => {
    expect(validatePaymentAmount(Number.NaN, 100)).toBe('Nominal pembayaran harus lebih dari 0')
    expect(validatePaymentAmount(0, 100)).toBe('Nominal pembayaran harus lebih dari 0')
    expect(validatePaymentAmount(101, 100)).toBe('Nominal melebihi sisa tagihan')
  })

  it('accepts valid partial and full values', () => {
    expect(validatePaymentAmount(50, 100)).toBeNull()
    expect(validatePaymentAmount(100, 100)).toBeNull()
  })
})
