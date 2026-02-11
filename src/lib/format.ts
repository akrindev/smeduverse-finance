export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('id-ID')
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
