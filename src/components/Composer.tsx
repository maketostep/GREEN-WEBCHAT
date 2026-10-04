import { PaperPlaneRightIcon } from '@phosphor-icons/react'
import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

const MAX_LENGTH = 4000

interface Props {
  readonly onSend: (text: string) => void
}

export function Composer({ onSend }: Props) {
  const [text, setText] = useState('')
  const field = useRef<HTMLTextAreaElement>(null)
  const trimmed = text.trim()

  const submit = () => {
    if (!trimmed) return
    onSend(trimmed)
    setText('')
    field.current?.focus()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-210 shrink-0 items-end gap-2 px-3 pb-4 md:px-6">
      <textarea
        ref={field}
        aria-label="Сообщение"
        placeholder="Сообщение"
        rows={1}
        maxLength={MAX_LENGTH}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        className="field-sizing-content max-h-40 min-h-12 flex-1 resize-none rounded-xl border border-divider bg-white px-4 py-3.5 leading-5 outline-hidden placeholder:text-tertiary focus:border-accent/40"
      />
      <button
        type="submit"
        disabled={!trimmed}
        aria-label="Отправить"
        className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover disabled:bg-white disabled:text-tertiary"
      >
        <PaperPlaneRightIcon size={22} weight="fill" aria-hidden="true" />
      </button>
    </form>
  )
}
