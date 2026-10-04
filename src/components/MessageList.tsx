import type { Message } from '../types'
import { MessageBubble } from './MessageBubble'

interface Props {
  readonly messages: readonly Message[]
  readonly onRetry: (message: Message) => void
}

export function MessageList({ messages, onRetry }: Props) {
  if (messages.length === 0) {
    return (
      <div className="grid flex-1 place-items-center p-4">
        <p className="rounded-full bg-black/20 px-4 py-1.5 text-[15px] text-white">Сообщений пока нет</p>
      </div>
    )
  }
  return (
    <div role="log" aria-live="polite" className="flex flex-1 flex-col-reverse overflow-y-auto px-3 py-4 md:px-6">
      <ol className="mx-auto flex w-full max-w-198 flex-col gap-1">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} onRetry={onRetry} />
        ))}
      </ol>
    </div>
  )
}
