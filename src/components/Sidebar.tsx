import { PencilSimpleLineIcon, SignOutIcon } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import type { Chat, Message } from '../types'
import { ChatListItem } from './ChatListItem'
import { IconButton } from './IconButton'
import { NewChatForm } from './NewChatForm'

interface Props {
  readonly className: string
  readonly chats: readonly Chat[]
  readonly messages: readonly Message[]
  readonly activeChatId: string | null
  readonly online: boolean
  readonly onSelect: (chatId: string) => void
  readonly onCreate: (phone: string) => Promise<void>
  readonly onLogout: () => void
  readonly children?: ReactNode
}

export function Sidebar({ className, chats, messages, activeChatId, online, onSelect, onCreate, onLogout, children }: Props) {
  const [creating, setCreating] = useState(false)

  const create = async (phone: string) => {
    await onCreate(phone)
    setCreating(false)
  }

  return (
    <aside className={`${className} w-full shrink-0 flex-col border-r border-divider bg-white md:w-90 lg:w-98`}>
      <header className="flex h-14 shrink-0 items-center gap-1 pr-2 pl-5">
        <h1 className="flex-1 text-[17px] font-semibold">Чаты</h1>
        <IconButton icon={PencilSimpleLineIcon} label="Новый чат" onClick={() => setCreating((value) => !value)} />
        <IconButton icon={SignOutIcon} label="Выйти" onClick={onLogout} />
      </header>
      {!online && (
        <p role="status" className="mx-3 mb-2 rounded-xl bg-negative/10 px-3 py-2 text-[13px] text-negative">
          Нет соединения с GREEN-API, переподключаемся…
        </p>
      )}
      {children}
      {creating && <NewChatForm onCreate={create} onCancel={() => setCreating(false)} />}
      {chats.length === 0 && !creating && (
        <div className="px-6 py-10 text-center text-[15px] text-secondary">
          <p>Чатов пока нет</p>
          <button type="button" onClick={() => setCreating(true)} className="mt-2 font-medium text-accent hover:underline">
            Написать по номеру телефона
          </button>
        </div>
      )}
      <ul className="flex-1 overflow-y-auto px-2 pb-2">
        {chats.map((chat) => (
          <ChatListItem
            key={chat.chatId}
            chat={chat}
            lastMessage={messages.findLast((message) => message.chatId === chat.chatId)}
            active={chat.chatId === activeChatId}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </aside>
  )
}
