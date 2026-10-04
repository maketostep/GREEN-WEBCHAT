import type { Credentials } from '../types'
import { parseChats, type ChatState } from './chat-state'

export const CREDENTIALS_KEY = 'green-chat:credentials'
export const chatsKey = (idInstance: string) => `green-chat:chats:${idInstance}`

function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null')
  } catch {
    return null
  }
}

function isCredentials(value: unknown): value is Credentials {
  if (typeof value !== 'object' || value === null) return false
  const { apiUrl, idInstance, apiTokenInstance } = value as Record<string, unknown>
  return [apiUrl, idInstance, apiTokenInstance].every((field) => typeof field === 'string')
}

export function loadCredentials(): Credentials | null {
  const value = read(CREDENTIALS_KEY)
  return isCredentials(value) ? value : null
}

export function saveCredentials(credentials: Credentials): void {
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials))
}

export function loadChats(idInstance: string): ChatState {
  return parseChats(read(chatsKey(idInstance)))
}

export function saveChats(idInstance: string, state: ChatState): void {
  try {
    localStorage.setItem(chatsKey(idInstance), JSON.stringify(state))
  } catch (error) {
    console.error(error)
  }
}

export function clearSession(idInstance: string): void {
  localStorage.removeItem(CREDENTIALS_KEY)
  localStorage.removeItem(chatsKey(idInstance))
}
