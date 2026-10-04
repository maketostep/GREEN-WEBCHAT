import { useEffect, useReducer, useRef, useState } from 'react'
import { checkAccount, errorMessage, getChatHistory, getChats, sendMessage } from '../api/green-api'
import { useNotifications } from '../hooks/useNotifications'
import { chatReducer } from '../lib/chat-state'
import { parseChatList, parseHistory } from '../lib/history'
import { CREDENTIALS_KEY, chatsKey, loadChats, saveChats } from '../lib/storage'
import type { Credentials, Message } from '../types'
import { ChatPanel } from './ChatPanel'
import { ReceivingNotice } from './ReceivingNotice'
import { Sidebar } from './Sidebar'

interface HistoryStatus {
  readonly loading: boolean
  readonly error: string | null
}

const IDLE: HistoryStatus = { loading: false, error: null }

const createLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2)}`

interface Props {
  readonly credentials: Credentials
  readonly onLogout: () => void
}

export function Messenger({ credentials, onLogout }: Props) {
  const [state, dispatch] = useReducer(chatReducer, credentials.idInstance, loadChats)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [history, setHistory] = useState<Readonly<Record<string, HistoryStatus>>>({})
  const requested = useRef(new Set<string>())
  const online = useNotifications(credentials, dispatch)

  useEffect(() => {
    getChats(credentials)
      .then((raw) => dispatch({ type: 'chatsLoaded', chats: parseChatList(raw) }))
      .catch((error: unknown) => console.error(error))
  }, [credentials])

  useEffect(() => {
    if (!activeChatId || requested.current.has(activeChatId)) return
    const chatId = activeChatId
    requested.current.add(chatId)
    setHistory((prev) => ({ ...prev, [chatId]: { loading: true, error: null } }))
    getChatHistory(credentials, chatId)
      .then((raw) => {
        dispatch({ type: 'historyLoaded', messages: parseHistory(raw, chatId) })
        setHistory((prev) => ({ ...prev, [chatId]: IDLE }))
      })
      .catch((error: unknown) => {
        requested.current.delete(chatId)
        setHistory((prev) => ({ ...prev, [chatId]: { loading: false, error: errorMessage(error) } }))
        console.error(error)
      })
  }, [activeChatId, credentials])

  useEffect(() => saveChats(credentials.idInstance, state), [credentials.idInstance, state])

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === CREDENTIALS_KEY && event.newValue === null) {
        onLogout()
        return
      }
      if (event.key === chatsKey(credentials.idInstance) && event.newValue !== null) {
        dispatch({ type: 'stateReplaced', state: loadChats(credentials.idInstance) })
      }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [credentials.idInstance, onLogout])

  const openChat = async (phone: string) => {
    // Известные номера не перепроверяем, чтобы экономить квоту CheckAccount
    const known = state.chats.find((chat) => chat.phone === phone)
    if (known) {
      setActiveChatId(known.chatId)
      return
    }
    const { exist, chatId } = await checkAccount(credentials, phone)
    if (!exist) throw new Error('Номер не зарегистрирован в MAX')
    dispatch({ type: 'chatOpened', chat: { chatId, phone } })
    setActiveChatId(chatId)
  }

  const deliver = async (message: Message) => {
    try {
      const { idMessage } = await sendMessage(credentials, message.chatId, message.text)
      dispatch({ type: 'messageSent', id: message.id, idMessage })
    } catch (error) {
      dispatch({ type: 'messageFailed', id: message.id, error: errorMessage(error) })
    }
  }

  const send = (text: string) => {
    if (!activeChatId) return
    const message: Message = { id: createLocalId(), chatId: activeChatId, text, timestamp: Date.now(), outgoing: true, status: 'pending' }
    dispatch({ type: 'messageAdded', message })
    void deliver(message)
  }

  const retry = (message: Message) => {
    dispatch({ type: 'messageRetried', id: message.id })
    void deliver(message)
  }

  const status = (activeChatId && history[activeChatId]) || IDLE
  const activeChat = state.chats.find((chat) => chat.chatId === activeChatId)

  return (
    <div className="flex h-full">
      <Sidebar
        className={activeChat ? 'hidden md:flex' : 'flex'}
        chats={state.chats}
        messages={state.messages}
        activeChatId={activeChatId}
        online={online}
        onSelect={setActiveChatId}
        onCreate={openChat}
        onLogout={onLogout}
      >
        <ReceivingNotice credentials={credentials} />
      </Sidebar>
      <ChatPanel
        className={activeChat ? 'flex' : 'hidden md:flex'}
        chat={activeChat}
        messages={state.messages.filter((message) => message.chatId === activeChatId)}
        loadingHistory={status.loading}
        historyError={status.error}
        onSend={send}
        onRetry={retry}
        onBack={() => setActiveChatId(null)}
      />
    </div>
  )
}
