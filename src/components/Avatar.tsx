import { UserIcon } from '@phosphor-icons/react'
import type { Chat } from '../types'

const GRADIENTS = [
  'from-[#9b90fe] to-[#6746ec]',
  'from-[#1bd6e3] to-[#27a5c8]',
  'from-[#fa82ba] to-[#e74aa6]',
  'from-[#ffb381] to-[#e5782d]',
]

function pickGradient(chatId: string): string {
  const hash = [...chatId].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return GRADIENTS[hash % GRADIENTS.length]
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
}

interface Props {
  readonly chat: Chat
  readonly size: 'md' | 'lg'
}

export function Avatar({ chat, size }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-linear-to-b font-medium text-white ${pickGradient(chat.chatId)} ${size === 'lg' ? 'size-12 text-lg' : 'size-10'}`}
    >
      {chat.name ? initials(chat.name) : <UserIcon weight="fill" className="size-1/2" aria-hidden="true" />}
    </span>
  )
}
