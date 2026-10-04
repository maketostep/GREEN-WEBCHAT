import { describe, expect, it } from 'vitest'
import type { Message } from '../types'
import { EMPTY_STATE, chatReducer, parseChats } from './chat-state'

const incoming = (id: string, chatId = '10'): Message => ({ id, chatId, text: 'привет', timestamp: 1, outgoing: false })

describe('chatReducer', () => {
  it('replaces the whole state', () => {
    const next = { chats: [{ chatId: '10' }], messages: [incoming('m1')] }
    expect(chatReducer(EMPTY_STATE, { type: 'stateReplaced', state: next })).toBe(next)
  })

  it('creates a chat for a message from an unknown sender', () => {
    const state = chatReducer(EMPTY_STATE, { type: 'messageAdded', message: incoming('m1'), chatName: 'Иван' })
    expect(state.chats).toEqual([{ chatId: '10', name: 'Иван' }])
    expect(state.messages).toHaveLength(1)
  })

  it('ignores a notification it has already seen', () => {
    const once = chatReducer(EMPTY_STATE, { type: 'messageAdded', message: incoming('m1') })
    expect(chatReducer(once, { type: 'messageAdded', message: incoming('m1') })).toBe(once)
  })

  it('puts a reply into the chat opened by phone and lifts it to the top', () => {
    const opened = [
      { chatId: '10', phone: '79991234567' },
      { chatId: '20', phone: '79990000000' },
    ].reduce((state, chat) => chatReducer(state, { type: 'chatOpened', chat }), EMPTY_STATE)
    const state = chatReducer(opened, { type: 'messageAdded', message: incoming('m1', '10'), chatName: 'Иван' })
    expect(state.chats).toEqual([
      { chatId: '10', phone: '79991234567', name: 'Иван' },
      { chatId: '20', phone: '79990000000' },
    ])
  })

  it('tracks sending, failure and retry of an outgoing message', () => {
    const pending: Message = { id: 'local', chatId: '10', text: 'hi', timestamp: 1, outgoing: true, status: 'pending' }
    const queued = chatReducer(EMPTY_STATE, { type: 'messageAdded', message: pending })
    const failed = chatReducer(queued, { type: 'messageFailed', id: 'local', error: 'Ошибка' })
    expect(failed.messages[0]).toMatchObject({ status: 'failed', error: 'Ошибка' })
    const retried = chatReducer(failed, { type: 'messageRetried', id: 'local' })
    expect(retried.messages[0]?.status).toBe('pending')
    const sent = chatReducer(retried, { type: 'messageSent', id: 'local', idMessage: 'srv1' })
    expect(sent.messages[0]).toMatchObject({ id: 'srv1' })
    expect(sent.messages[0]?.status).toBeUndefined()
    expect(sent.messages[0]?.error).toBeUndefined()
  })

  it('drops the local copy when history already delivered the sent message', () => {
    const pending: Message = { id: 'local', chatId: '10', text: 'hi', timestamp: 5, outgoing: true, status: 'pending' }
    const fromHistory: Message = { id: 'srv1', chatId: '10', text: 'hi', timestamp: 5, outgoing: true }
    const state = { chats: [{ chatId: '10' }], messages: [pending, fromHistory] }
    const sent = chatReducer(state, { type: 'messageSent', id: 'local', idMessage: 'srv1' })
    expect(sent.messages).toEqual([fromHistory])
  })

  it('keeps the local id and message when the server id is the same', () => {
    const pending: Message = { id: 'local', chatId: '10', text: 'hi', timestamp: 5, outgoing: true, status: 'pending' }
    const sent = chatReducer({ chats: [], messages: [pending] }, { type: 'messageSent', id: 'local', idMessage: 'local' })
    expect(sent.messages).toEqual([{ id: 'local', chatId: '10', text: 'hi', timestamp: 5, outgoing: true }])
  })

  it('replaces interrupted local sends with their copy from history', () => {
    const failed: Message = { id: 'local', chatId: '10', text: 'hi', timestamp: 100000, outgoing: true, status: 'failed', error: 'Отправка прервана' }
    const other: Message = { ...failed, id: 'other', text: 'другое' }
    const copy: Message = { id: 'srv', chatId: '10', text: 'hi', timestamp: 130000, outgoing: true }
    const next = chatReducer({ chats: [], messages: [failed, other] }, { type: 'historyLoaded', messages: [copy] })
    expect(next.messages.map((m) => m.id)).toEqual(['other', 'srv'])
  })

  it('fills empty chat fields from the server list and appends new chats', () => {
    const state = { chats: [{ chatId: '10', name: 'Иван' }, { chatId: '20' }], messages: [] }
    const next = chatReducer(state, {
      type: 'chatsLoaded',
      chats: [
        { chatId: '30', name: 'Новый' },
        { chatId: '20', name: 'Пётр', phone: '79990000000' },
        { chatId: '10', name: 'Другой', phone: '79991234567' },
      ],
    })
    expect(next.chats).toEqual([
      { chatId: '10', name: 'Иван', phone: '79991234567' },
      { chatId: '20', name: 'Пётр', phone: '79990000000' },
      { chatId: '30', name: 'Новый' },
    ])
  })

  it('merges history by id, sorts by time and leaves chats alone', () => {
    const state = { chats: [{ chatId: '10' }, { chatId: '20' }], messages: [{ ...incoming('m2'), timestamp: 20 }] }
    const next = chatReducer(state, {
      type: 'historyLoaded',
      messages: [
        { ...incoming('m3'), timestamp: 30 },
        { ...incoming('m2'), timestamp: 99 },
        { ...incoming('m1'), timestamp: 10 },
      ],
    })
    expect(next.messages.map((m) => [m.id, m.timestamp])).toEqual([['m1', 10], ['m2', 20], ['m3', 30]])
    expect(next.chats).toBe(state.chats)
  })
})

describe('parseChats', () => {
  it('marks messages left pending by a reload as failed', () => {
    const saved = { chats: [{ chatId: '10' }], messages: [{ ...incoming('local'), outgoing: true, status: 'pending' }] }
    expect(parseChats(saved).messages[0]).toMatchObject({ status: 'failed' })
  })

  it('falls back to an empty state on broken data', () => {
    expect(parseChats(null)).toEqual(EMPTY_STATE)
    expect(parseChats({ chats: 'x' })).toEqual(EMPTY_STATE)
  })

  it('drops broken entries and keeps the rest', () => {
    expect(parseChats({ chats: [null, 5, { chatId: '10' }], messages: [null, { text: 1 }, incoming('m1')] })).toEqual({
      chats: [{ chatId: '10' }],
      messages: [incoming('m1')],
    })
  })
})
