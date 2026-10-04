import { describe, expect, it } from 'vitest'
import { parseChatList, parseHistory } from './history'

describe('parseChatList', () => {
  it('keeps only personal chats in order and reads name and phone', () => {
    const raw = [
      { chatId: '1', name: 'Иван', type: 'user', phoneNumber: 79991234567, unreadCount: 0 },
      { chatId: '2', name: 'Бот', type: 'bot', phoneNumber: 0 },
      { chatId: '3', name: 'Группа', type: 'group', phoneNumber: 0 },
      { chatId: '4', name: '', type: 'user', phoneNumber: 0 },
      { chatId: '5', type: 'user', phoneNumber: '79990000000' },
      { type: 'user', name: 'Без id' },
      null,
      'text',
    ]
    expect(parseChatList(raw)).toEqual([
      { chatId: '1', name: 'Иван', phone: '79991234567' },
      { chatId: '4', name: undefined, phone: undefined },
      { chatId: '5', name: undefined, phone: undefined },
    ])
  })

  it('returns an empty list for non-arrays', () => {
    expect(parseChatList({ chatId: '1', type: 'user' })).toEqual([])
    expect(parseChatList(null)).toEqual([])
  })
})

describe('parseHistory', () => {
  const item = (extra: Record<string, unknown>) => ({
    type: 'incoming',
    idMessage: 'a',
    timestamp: 100,
    typeMessage: 'textMessage',
    textMessage: 'привет',
    ...extra,
  })

  it('maps text messages and sorts oldest first', () => {
    const raw = [
      item({ idMessage: 'c', timestamp: 300, type: 'outgoing', textMessage: 'третье' }),
      item({ idMessage: 'a', timestamp: 100 }),
      item({ idMessage: 'b', timestamp: 200, typeMessage: 'extendedTextMessage', textMessage: '', extendedTextMessage: { text: 'второе' } }),
    ]
    expect(parseHistory(raw, '10')).toEqual([
      { id: 'a', chatId: '10', text: 'привет', timestamp: 100000, outgoing: false },
      { id: 'b', chatId: '10', text: 'второе', timestamp: 200000, outgoing: false },
      { id: 'c', chatId: '10', text: 'третье', timestamp: 300000, outgoing: true },
    ])
  })

  it('drops media, deleted, empty and broken items', () => {
    const raw = [
      item({ typeMessage: 'imageMessage' }),
      item({ isDeleted: true }),
      item({ textMessage: '' }),
      item({ type: 'system' }),
      item({ idMessage: 5 }),
      item({ timestamp: '1' }),
      item({ typeMessage: 'quotedMessage', textMessage: '', extendedTextMessage: { text: '' } }),
      42,
      null,
    ]
    expect(parseHistory(raw, '10')).toEqual([])
  })

  it('returns an empty list for non-arrays', () => {
    expect(parseHistory({}, '10')).toEqual([])
  })
})
