import { useEffect, useReducer, useState } from 'react'
import { checkAccount, errorMessage, sendMessage } from '../api/green-api'
import { useNotifications } from '../hooks/useNotifications'
import { chatReducer } from '../lib/chat-state'
import { chatsKey, loadChats, saveChats } from '../lib/storage'
import type { Credentials, Message } from '../types'
import { ChatPanel } from './ChatPanel'
import { ReceivingNotice } from './ReceivingNotice'
import { Sidebar } from './Sidebar'

const createLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2)}`

interface Props {
  readonly credentials: Credentials
  readonly onLogout: () => void
}

export function Messenger({ credentials, onLogout }: Props) {
  const [state, dispatch] = useReducer(chatReducer, credentials.idInstance, loadChats)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const online = useNotifications(credentials, dispatch)

  useEffect(() => saveChats(credentials.idInstance, state), [credentials.idInstance, state])

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === chatsKey(credentials.idInstance)) {
        dispatch({ type: 'stateReplaced', state: loadChats(credentials.idInstance) })
      }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [credentials.idInstance])

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
      await sendMessage(credentials, message.chatId, message.text)
      dispatch({ type: 'messageSent', id: message.id })
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
        onSend={send}
        onRetry={retry}
        onBack={() => setActiveChatId(null)}
      />
    </div>
  )
}
