import type { Chat } from '../types'
import { formatPhone } from './phone'

const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' })

export const formatTime = (timestamp: number): string => timeFormat.format(timestamp)

export function formatListTime(timestamp: number, now = Date.now()): string {
  const sameDay = new Date(timestamp).toDateString() === new Date(now).toDateString()
  return sameDay ? formatTime(timestamp) : dateFormat.format(timestamp)
}

export function chatTitle(chat: Chat): string {
  return chat.name ?? (chat.phone ? formatPhone(chat.phone) : chat.chatId)
}
