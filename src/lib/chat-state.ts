import type { Chat, Message } from '../types'

export interface ChatState {
  readonly chats: readonly Chat[]
  readonly messages: readonly Message[]
}

export const EMPTY_STATE: ChatState = { chats: [], messages: [] }

export type ChatAction =
  | { readonly type: 'chatOpened'; readonly chat: Chat }
  | { readonly type: 'messageAdded'; readonly message: Message; readonly chatName?: string }
  | { readonly type: 'messageSent'; readonly id: string; readonly idMessage: string }
  | { readonly type: 'chatsLoaded'; readonly chats: readonly Chat[] }
  | { readonly type: 'historyLoaded'; readonly messages: readonly Message[] }
  | { readonly type: 'messageFailed'; readonly id: string; readonly error: string }
  | { readonly type: 'messageRetried'; readonly id: string }
  | { readonly type: 'stateReplaced'; readonly state: ChatState }

function upsertChat(chats: readonly Chat[], chat: Chat): readonly Chat[] {
  const existing = chats.find((c) => c.chatId === chat.chatId)
  const merged = existing ? { ...existing, phone: existing.phone ?? chat.phone, name: existing.name ?? chat.name } : chat
  return [merged, ...chats.filter((c) => c.chatId !== chat.chatId)]
}

function mergeChats(chats: readonly Chat[], loaded: readonly Chat[]): readonly Chat[] {
  const filled = chats.map((c) => {
    const server = loaded.find((l) => l.chatId === c.chatId)
    return server ? { ...c, name: c.name ?? server.name, phone: c.phone ?? server.phone } : c
  })
  const known = new Set(chats.map((c) => c.chatId))
  return [...filled, ...loaded.filter((l) => !known.has(l.chatId))]
}

const RECOVERY_WINDOW_MS = 60_000

const isRecoveredByHistory = (local: Message, history: readonly Message[]): boolean =>
  local.outgoing &&
  local.status !== undefined &&
  history.some(
    (h) => h.outgoing && h.chatId === local.chatId && h.text === local.text && Math.abs(h.timestamp - local.timestamp) <= RECOVERY_WINDOW_MS,
  )

function patchMessage(messages: readonly Message[], id: string, patch: Partial<Message>): readonly Message[] {
  return messages.map((m) => (m.id === id ? { ...m, ...patch } : m))
}

const isChat = (value: unknown): value is Chat =>
  typeof value === 'object' && value !== null && typeof (value as Chat).chatId === 'string'

const isMessage = (value: unknown): value is Message =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Message).id === 'string' &&
  typeof (value as Message).chatId === 'string' &&
  typeof (value as Message).text === 'string'

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'chatOpened':
      return { ...state, chats: upsertChat(state.chats, action.chat) }
    case 'messageAdded': {
      const { message, chatName } = action
      if (state.messages.some((m) => m.id === message.id)) return state
      return {
        chats: upsertChat(state.chats, { chatId: message.chatId, name: chatName }),
        messages: [...state.messages, message],
      }
    }
    case 'messageSent': {
      const { id, idMessage } = action
      if (idMessage !== id && state.messages.some((m) => m.id === idMessage)) return { ...state, messages: state.messages.filter((m) => m.id !== id) }
      return { ...state, messages: patchMessage(state.messages, id, { id: idMessage, status: undefined, error: undefined }) }
    }
    case 'chatsLoaded':
      return { ...state, chats: mergeChats(state.chats, action.chats) }
    case 'historyLoaded': {
      const known = new Set(state.messages.map((m) => m.id))
      const fresh = action.messages.filter((m) => !known.has(m.id))
      const kept = state.messages.filter((m) => !isRecoveredByHistory(m, fresh))
      return { ...state, messages: [...kept, ...fresh].sort((a, b) => a.timestamp - b.timestamp) }
    }
    case 'messageFailed':
      return { ...state, messages: patchMessage(state.messages, action.id, { status: 'failed', error: action.error }) }
    case 'stateReplaced':
      return action.state
    case 'messageRetried':
      return { ...state, messages: patchMessage(state.messages, action.id, { status: 'pending', error: undefined }) }
  }
}

export function parseChats(value: unknown): ChatState {
  const saved = value as Partial<ChatState> | null
  if (!saved || !Array.isArray(saved.chats) || !Array.isArray(saved.messages)) return EMPTY_STATE
  return {
    chats: saved.chats.filter(isChat),
    messages: saved.messages.filter(isMessage).map((m: Message) =>
      m.status === 'pending' ? { ...m, status: 'failed', error: 'Отправка прервана' } : m,
    ),
  }
}
