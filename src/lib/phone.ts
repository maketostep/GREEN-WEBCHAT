function toInternational(digits: string): string {
  if (digits.length === 10 && digits.startsWith('9')) return `7${digits}`
  if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`
  return digits
}

export function normalizePhone(input: string): string | null {
  const digits = toInternational(input.replace(/\D/g, ''))
  return /^(7\d{10}|375\d{9})$/.test(digits) ? digits : null
}

export function formatPhone(digits: string): string {
  const ru = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(digits)
  if (ru) return `+7 ${ru[1]} ${ru[2]}-${ru[3]}-${ru[4]}`
  const by = /^375(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(digits)
  if (by) return `+375 ${by[1]} ${by[2]}-${by[3]}-${by[4]}`
  return `+${digits}`
}
