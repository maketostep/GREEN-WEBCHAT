import { ClockIcon } from '@phosphor-icons/react'
import { formatTime } from '../lib/format'
import type { Message } from '../types'

interface Props {
  readonly message: Message
  readonly onRetry: (message: Message) => void
}

export function MessageBubble({ message, onRetry }: Props) {
  const { outgoing, status } = message
  return (
    <li className={`flex flex-col ${outgoing ? 'items-end pl-12 md:pl-16' : 'items-start pr-12'}`}>
      <div
        className={`flex max-w-120 flex-wrap items-end gap-x-2 rounded-2xl px-3 pt-1.5 pb-1 ${
          outgoing ? 'rounded-br-md bg-bubble-out text-bubble-out-text' : 'rounded-bl-md bg-bubble-in'
        } ${status === 'pending' ? 'opacity-70' : ''}`}
      >
        <p className="min-w-0 leading-5 whitespace-pre-wrap wrap-anywhere">{message.text}</p>
        <span className={`ml-auto flex items-center gap-0.5 text-xs leading-4 ${outgoing ? 'text-bubble-out-time' : 'text-tertiary'}`}>
          {status === 'pending' && <ClockIcon size={12} aria-hidden="true" />}
          {formatTime(message.timestamp)}
        </span>
      </div>
      {status === 'failed' && (
        <button type="button" onClick={() => onRetry(message)} className="mt-1 text-[13px] text-negative hover:underline">
          {message.error ?? 'Не отправлено'}. Повторить
        </button>
      )}
    </li>
  )
}
