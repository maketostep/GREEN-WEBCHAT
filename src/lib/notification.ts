export interface IncomingText {
  readonly idMessage: string
  readonly chatId: string
  readonly chatName?: string
  readonly text: string
  readonly timestamp: number
}

type Json = Record<string, unknown>

const TEXT_FIELDS = new Map<string, readonly [string, string]>([
  ['textMessage', ['textMessageData', 'textMessage']],
  ['extendedTextMessage', ['extendedTextMessageData', 'text']],
  ['quotedMessage', ['extendedTextMessageData', 'text']],
])

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null

function extractText(data: Json): string | null {
  const fields = TEXT_FIELDS.get(String(data.typeMessage))
  if (!fields) return null
  const container = data[fields[0]]
  const text = isObject(container) ? container[fields[1]] : null
  return typeof text === 'string' && text !== '' ? text : null
}

export function parseIncomingText(body: unknown): IncomingText | null {
  if (!isObject(body) || body.typeWebhook !== 'incomingMessageReceived') return null
  const { idMessage, timestamp, senderData, messageData } = body
  if (typeof idMessage !== 'string' || !isObject(senderData) || !isObject(messageData)) return null
  const { chatId, chatName } = senderData
  const text = extractText(messageData)
  if (typeof chatId !== 'string' || text === null) return null
  return {
    idMessage,
    chatId,
    chatName: typeof chatName === 'string' && chatName !== '' ? chatName : undefined,
    text,
    timestamp: typeof timestamp === 'number' ? timestamp * 1000 : Date.now(),
  }
}
