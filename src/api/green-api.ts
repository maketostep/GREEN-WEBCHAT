import type { Credentials } from '../types'

const RECEIVE_TIMEOUT_SEC = 20

function describeStatus(status: number): string {
  if (status === 401 || status === 403) return 'Неверный idInstance или apiTokenInstance'
  if (status === 466) return 'Превышен лимит тарифа GREEN-API'
  if (status === 429 || status === 469) return 'Слишком много запросов, попробуйте позже'
  return `Ошибка GREEN-API (${status})`
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(describeStatus(status))
    this.status = status
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof TypeError) return 'Нет связи с GREEN-API. Проверьте apiUrl и интернет'
  if (error instanceof SyntaxError) return 'Неожиданный ответ GREEN-API. Проверьте apiUrl'
  return error instanceof Error ? error.message : String(error)
}

export function deriveApiUrl(idInstance: string): string {
  return `https://${idInstance.slice(0, 4)}.api.green-api.com`
}

async function call<T>(creds: Credentials, method: string, init: RequestInit = {}, suffix = ''): Promise<T> {
  const url = `${creds.apiUrl}/waInstance${creds.idInstance}/${method}/${creds.apiTokenInstance}${suffix}`
  const response = await fetch(url, init)
  if (!response.ok) throw new ApiError(response.status)
  const text = await response.text()
  return (text ? JSON.parse(text) : null) as T
}

function post<T>(creds: Credentials, method: string, body: object): Promise<T> {
  return call<T>(creds, method, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function getStateInstance(creds: Credentials): Promise<{ stateInstance: string }> {
  return call(creds, 'getStateInstance')
}

export interface InstanceSettings {
  readonly webhookUrl: string
  readonly incomingWebhook: string
}

export type ReceivingProblem = 'webhook' | 'disabled'

export function getSettings(creds: Credentials): Promise<InstanceSettings> {
  return call(creds, 'getSettings')
}

export function enableIncomingWebhook(creds: Credentials): Promise<{ saveSettings: boolean }> {
  return post(creds, 'setSettings', { incomingWebhook: 'yes' })
}

export function receivingProblem({ webhookUrl, incomingWebhook }: InstanceSettings): ReceivingProblem | null {
  if (webhookUrl) return 'webhook'
  return incomingWebhook === 'yes' ? null : 'disabled'
}

export function checkAccount(creds: Credentials, phone: string): Promise<{ exist: boolean; chatId: string }> {
  return post(creds, 'checkAccount', { phoneNumber: Number(phone) })
}

export function sendMessage(creds: Credentials, chatId: string, message: string): Promise<unknown> {
  return post(creds, 'sendMessage', { chatId, message })
}

export interface Notification {
  readonly receiptId: number
  readonly body: unknown
}

export function receiveNotification(creds: Credentials, signal: AbortSignal): Promise<Notification | null> {
  return call(creds, 'receiveNotification', { signal }, `?receiveTimeout=${RECEIVE_TIMEOUT_SEC}`)
}

export function deleteNotification(creds: Credentials, receiptId: number, signal: AbortSignal): Promise<{ result: boolean }> {
  return call(creds, 'deleteNotification', { method: 'DELETE', signal }, `/${receiptId}`)
}

export function getChats(creds: Credentials): Promise<unknown> {
  return call(creds, 'getChats')
}

export function getChatHistory(creds: Credentials, chatId: string, count = 100): Promise<unknown> {
  return post(creds, 'getChatHistory', { chatId, count })
}
