import { describe, expect, it } from 'vitest'
import { formatPhone, normalizePhone } from './phone'

describe('normalizePhone', () => {
  it.each([
    ['+7 (999) 123-45-67', '79991234567'],
    ['89991234567', '79991234567'],
    ['9991234567', '79991234567'],
    ['+375 29 123-45-67', '375291234567'],
    ['8 029 123-45-67', '375291234567'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it.each(['', '12345', '+1 202 555 0123', '7999123456789'])('rejects "%s"', (input) => {
    expect(normalizePhone(input)).toBeNull()
  })
})

describe('formatPhone', () => {
  it('formats russian and belarusian numbers', () => {
    expect(formatPhone('79991234567')).toBe('+7 999 123-45-67')
    expect(formatPhone('375291234567')).toBe('+375 29 123-45-67')
  })
})
