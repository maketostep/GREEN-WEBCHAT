import type { Chat, Message } from '../types'

type Json = Record<string, unknown>

const TEXT_TYPES = new Set(['textMessage', 'extendedTextMessage', 'quotedMessage'])

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null

const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value !== ''

function toChat(item: Json): Chat | null {
  const { chatId, name, type, phoneNumber } = item
  if (type !== 'user' || typeof chatId !== 'string') return null
  return {
    chatId,
    name: nonEmpty(name) ? name : undefined,
    phone: typeof phoneNumber === 'number' && phoneNumber > 0 ? String(phoneNumber) : undefined,
  }
}

export function parseChatList(value: unknown): Chat[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item: unknown) => {
    const chat = isObject(item) ? toChat(item) : null
    return chat ? [chat] : []
  })
}

function historyText(item: Json): string | null {
  if (!TEXT_TYPES.has(String(item.typeMessage))) return null
  if (nonEmpty(item.textMessage)) return item.textMessage
  const extended = item.extendedTextMessage
  return isObject(extended) && nonEmpty(extended.text) ? extended.text : null
}

function toMessage(item: Json, chatId: string): Message | null {
  const { type, idMessage, timestamp, isDeleted } = item
  if ((type !== 'incoming' && type !== 'outgoing') || typeof idMessage !== 'string') return null
  if (typeof timestamp !== 'number' || isDeleted === true) return null
  const text = historyText(item)
  if (text === null) return null
  return { id: idMessage, chatId, text, timestamp: timestamp * 1000, outgoing: type === 'outgoing' }
}

export function parseHistory(value: unknown, chatId: string): Message[] {
  if (!Array.isArray(value)) return []
  return value
    .flatMap((item: unknown) => {
      const message = isObject(item) ? toMessage(item, chatId) : null
      return message ? [message] : []
    })
    .sort((a, b) => a.timestamp - b.timestamp)
}
