import { useState, type FormEvent } from 'react'
import { errorMessage } from '../api/green-api'
import { normalizePhone } from '../lib/phone'
import { TextField } from './TextField'

interface Props {
  readonly onCreate: (phone: string) => Promise<void>
  readonly onCancel: () => void
}

export function NewChatForm({ onCreate, onCancel }: Props) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const phone = normalizePhone(value)
    if (!phone) {
      setError('Нужен номер России или Беларуси: +7… или +375…')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onCreate(phone)
    } catch (caught) {
      setError(errorMessage(caught))
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(event) => event.key === 'Escape' && onCancel()}
      className="mx-3 mb-3 rounded-2xl bg-surface p-3"
    >
      <TextField label="Номер телефона" type="tel" value={value} onChange={setValue} placeholder="+7 999 123-45-67" autoFocus />
      {error && <p role="alert" className="mt-2 text-[13px] text-negative">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onCancel} className="h-10 flex-1 rounded-xl text-secondary transition-colors hover:bg-black/5">
          Отмена
        </button>
        <button
          type="submit"
          disabled={loading}
          className="h-10 flex-1 rounded-xl bg-accent font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? 'Ищем…' : 'Написать'}
        </button>
      </div>
    </form>
  )
}
