import { describe, expect, it } from 'vitest'
import { parseIncomingText } from './notification'

const incoming = {
  typeWebhook: 'incomingMessageReceived',
  instanceData: { idInstance: 310000001, wid: '79991234567@c.us', typeInstance: 'v3' },
  timestamp: 1763115112,
  idMessage: '126543123451133331119',
  senderData: {
    chatId: '10000000',
    chatName: 'Ходабрыш Пробешёлов',
    chatType: 'user',
    sender: '10000000',
    senderName: 'Ходабрыш Пробешёлов',
  },
  messageData: {
    typeMessage: 'textMessage',
    textMessageData: { textMessage: 'Привет от Green-API!' },
  },
}

describe('parseIncomingText', () => {
  it('parses an incoming text message', () => {
    expect(parseIncomingText(incoming)).toEqual({
      idMessage: '126543123451133331119',
      chatId: '10000000',
      chatName: 'Ходабрыш Пробешёлов',
      text: 'Привет от Green-API!',
      timestamp: 1763115112000,
    })
  })

  it('reads text of replies and messages with links', () => {
    for (const typeMessage of ['quotedMessage', 'extendedTextMessage']) {
      const body = { ...incoming, messageData: { typeMessage, extendedTextMessageData: { text: 'Ответ' } } }
      expect(parseIncomingText(body)?.text).toBe('Ответ')
    }
  })

  it('ignores other notifications and message types', () => {
    expect(parseIncomingText({ ...incoming, typeWebhook: 'outgoingAPIMessageReceived' })).toBeNull()
    expect(parseIncomingText({ ...incoming, messageData: { typeMessage: 'imageMessage' } })).toBeNull()
    expect(parseIncomingText({ ...incoming, messageData: { typeMessage: 'toString' } })).toBeNull()
    expect(parseIncomingText(null)).toBeNull()
  })
})
