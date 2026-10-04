import { describe, expect, it } from 'vitest'
import { ApiError, deriveApiUrl, errorMessage } from './green-api'

describe('deriveApiUrl', () => {
  it('uses the first four digits of idInstance', () => {
    expect(deriveApiUrl('3100123456')).toBe('https://3100.api.green-api.com')
  })
})

describe('errorMessage', () => {
  it('explains wrong credentials and network failures', () => {
    expect(errorMessage(new ApiError(401))).toBe('Неверный idInstance или apiTokenInstance')
    expect(errorMessage(new TypeError('Failed to fetch'))).toBe('Нет связи с GREEN-API. Проверьте apiUrl и интернет')
    expect(errorMessage(new Error('Номер не зарегистрирован в MAX'))).toBe('Номер не зарегистрирован в MAX')
  })
})
