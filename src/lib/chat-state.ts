import type { Chat, Message } from '../types'

export interface ChatState {
  readonly chats: readonly Chat[]
  readonly messages: readonly Message[]
}

export const EMPTY_STATE: ChatState = { chats: [], messages: [] }

export type ChatAction =
  | { readonly type: 'chatOpened'; readonly chat: Chat }
  | { readonly type: 'messageAdded'; readonly message: Message; readonly chatName?: string }
  | { readonly type: 'messageSent'; readonly id: string }
  | { readonly type: 'messageFailed'; readonly id: string; readonly error: string }
  | { readonly type: 'messageRetried'; readonly id: string }
  | { readonly type: 'stateReplaced'; readonly state: ChatState }

function upsertChat(chats: readonly Chat[], chat: Chat): readonly Chat[] {
  const existing = chats.find((c) => c.chatId === chat.chatId)
  const merged = existing ? { ...existing, phone: existing.phone ?? chat.phone, name: existing.name ?? chat.name } : chat
  return [merged, ...chats.filter((c) => c.chatId !== chat.chatId)]
}

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
    case 'messageSent':
      return { ...state, messages: patchMessage(state.messages, action.id, { status: undefined, error: undefined }) }
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
