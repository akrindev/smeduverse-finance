export function formatCurrency(amount: number): string {
  const safeAmount = typeof amount === 'number' ? amount : 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(safeAmount)
}

export function formatDate(date: string): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function firstValidationMessage(errors?: Record<string, string[]>): string | null {
  if (!errors) return null
  for (const messages of Object.values(errors)) {
    if (messages.length > 0) return messages[0]
  }
  return null
}

export function parseStudentIds(raw: string): string[] | undefined {
  const parsed = raw.split(',').map((item) => item.trim()).filter(Boolean)
  return parsed.length > 0 ? parsed : undefined
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}
