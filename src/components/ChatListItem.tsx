import { chatTitle, formatListTime } from '../lib/format'
import { formatPhone } from '../lib/phone'
import type { Chat, Message } from '../types'
import { Avatar } from './Avatar'

interface Props {
  readonly chat: Chat
  readonly lastMessage?: Message
  readonly active: boolean
  readonly onSelect: (chatId: string) => void
}

export function ChatListItem({ chat, lastMessage, active, onSelect }: Props) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(chat.chatId)}
        aria-current={active || undefined}
        className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors ${active ? 'bg-accent/10' : 'hover:bg-black/4'}`}
      >
        <Avatar chat={chat} size="lg" />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="flex-1 truncate font-medium">{chatTitle(chat)}</span>
            {lastMessage && <time className="shrink-0 text-xs text-tertiary">{formatListTime(lastMessage.timestamp)}</time>}
          </span>
          <span className="block truncate text-[15px] text-secondary">
            {lastMessage ? `${lastMessage.outgoing ? 'Вы: ' : ''}${lastMessage.text}` : chat.phone ? formatPhone(chat.phone) : ''}
          </span>
        </span>
      </button>
    </li>
  )
}
