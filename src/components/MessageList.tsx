import type { Message } from '../types'
import { MessageBubble } from './MessageBubble'

interface Props {
  readonly messages: readonly Message[]
  readonly loading: boolean
  readonly error: string | null
  readonly onRetry: (message: Message) => void
}

function Pill({ children }: { readonly children: string }) {
  return <p className="rounded-full bg-black/20 px-4 py-1.5 text-[15px] text-white">{children}</p>
}

export function MessageList({ messages, loading, error, onRetry }: Props) {
  const errorPill = error && <Pill>{`Не удалось загрузить историю: ${error}`}</Pill>
  if (messages.length === 0) {
    return (
      <div className="grid flex-1 place-items-center p-4">
        {errorPill || <Pill>{loading ? 'Загружаем историю…' : 'Сообщений пока нет'}</Pill>}
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
      {errorPill && <div className="flex justify-center pb-2">{errorPill}</div>}
    </div>
  )
}
