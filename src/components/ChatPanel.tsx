import { ArrowLeftIcon } from '@phosphor-icons/react'
import { chatTitle } from '../lib/format'
import { formatPhone } from '../lib/phone'
import type { Chat, Message } from '../types'
import { Avatar } from './Avatar'
import { Composer } from './Composer'
import { IconButton } from './IconButton'
import { MessageList } from './MessageList'

interface Props {
  readonly className: string
  readonly chat?: Chat
  readonly messages: readonly Message[]
  readonly loadingHistory: boolean
  readonly historyError: string | null
  readonly onSend: (text: string) => void
  readonly onRetry: (message: Message) => void
  readonly onBack: () => void
}

export function ChatPanel({ className, chat, messages, loadingHistory, historyError, onSend, onRetry, onBack }: Props) {
  return (
    <main className={`${className} min-w-0 flex-1 flex-col bg-linear-to-br from-sky to-sea`}>
      {chat ? (
        <>
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-divider bg-white/90 px-2 backdrop-blur md:px-4">
            <IconButton icon={ArrowLeftIcon} label="Назад к чатам" onClick={onBack} className="md:hidden" />
            <Avatar chat={chat} size="md" />
            <div className="min-w-0">
              <h2 className="truncate font-medium">{chatTitle(chat)}</h2>
              {chat.name && chat.phone && <p className="text-[13px] text-tertiary">{formatPhone(chat.phone)}</p>}
            </div>
          </header>
          <MessageList
            key={`messages-${chat.chatId}`}
            messages={messages}
            loading={loadingHistory}
            error={historyError}
            onRetry={onRetry}
          />
          <Composer key={chat.chatId} onSend={onSend} />
        </>
      ) : (
        <div className="grid flex-1 place-items-center p-4">
          <p className="rounded-full bg-black/20 px-4 py-1.5 text-[15px] text-white">Выберите чат</p>
        </div>
      )}
    </main>
  )
}
