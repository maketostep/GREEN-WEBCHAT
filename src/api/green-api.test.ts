import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  checkAccount,
  deleteNotification,
  deriveApiUrl,
  enableIncomingWebhook,
  errorMessage,
  getSettings,
  getStateInstance,
  receiveNotification,
  receivingProblem,
  sendMessage,
} from './green-api'

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
    expect(errorMessage(new SyntaxError('Unexpected token'))).toBe('Неожиданный ответ GREEN-API. Проверьте apiUrl')
  })
})

describe('requests', () => {
  const creds = { apiUrl: 'https://3100.api.green-api.com', idInstance: '3100000001', apiTokenInstance: 'tok' }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls all seven endpoints with correct URLs and methods', async () => {
    const fetchMock = vi.fn(async () => new Response('{}'))
    vi.stubGlobal('fetch', fetchMock)

    const signal = new AbortController().signal

    await getStateInstance(creds)
    expect(fetchMock).toHaveBeenCalledWith('https://3100.api.green-api.com/waInstance3100000001/getStateInstance/tok', {})

    await getSettings(creds)
    expect(fetchMock).toHaveBeenCalledWith('https://3100.api.green-api.com/waInstance3100000001/getSettings/tok', {})

    await enableIncomingWebhook(creds)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://3100.api.green-api.com/waInstance3100000001/setSettings/tok',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incomingWebhook: 'yes' }),
      }),
    )

    await checkAccount(creds, '79991234567')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://3100.api.green-api.com/waInstance3100000001/checkAccount/tok',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: 79991234567 }),
      }),
    )

    await sendMessage(creds, '10000000', 'hi')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://3100.api.green-api.com/waInstance3100000001/sendMessage/tok',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: '10000000', message: 'hi' }),
      }),
    )

    await receiveNotification(creds, signal)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://3100.api.green-api.com/waInstance3100000001/receiveNotification/tok?receiveTimeout=20',
      expect.objectContaining({ signal }),
    )

    await deleteNotification(creds, 7, signal)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://3100.api.green-api.com/waInstance3100000001/deleteNotification/tok/7',
      expect.objectContaining({ method: 'DELETE', signal }),
    )
  })

  it('rejects with ApiError on non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 401 })))

    const error: unknown = await getStateInstance(creds).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 401, message: 'Неверный idInstance или apiTokenInstance' })
  })

  it('resolves to null for empty or null body', async () => {
    const fetchMockEmpty = vi.fn(async () => new Response(''))
    vi.stubGlobal('fetch', fetchMockEmpty)
    const resultEmpty = await receiveNotification(creds, new AbortController().signal)
    expect(resultEmpty).toBeNull()

    const fetchMockNull = vi.fn(async () => new Response('null'))
    vi.stubGlobal('fetch', fetchMockNull)
    const resultNull = await receiveNotification(creds, new AbortController().signal)
    expect(resultNull).toBeNull()
  })
})

describe('receivingProblem', () => {
  it.each([
    [{ webhookUrl: '', incomingWebhook: 'yes' }, null],
    [{ webhookUrl: '', incomingWebhook: 'no' }, 'disabled'],
    [{ webhookUrl: 'https://example.com/hook', incomingWebhook: 'yes' }, 'webhook'],
    [{ webhookUrl: 'https://example.com/hook', incomingWebhook: 'no' }, 'webhook'],
  ] as const)('%o -> %s', (settings, expected) => {
    expect(receivingProblem(settings)).toBe(expected)
  })
})
