import { useState, type FormEvent } from 'react'
import { deriveApiUrl, errorMessage, getStateInstance } from '../api/green-api'
import type { Credentials } from '../types'
import { TextField } from './TextField'

interface Props {
  readonly onLogin: (credentials: Credentials) => void
}

const env = import.meta.env

export function LoginScreen({ onLogin }: Props) {
  const [idInstance, setIdInstance] = useState(env.idInstance ?? '')
  const [apiTokenInstance, setApiTokenInstance] = useState(env.apiTokenInstance ?? '')
  const [apiUrl, setApiUrl] = useState(env.apiUrl ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const id = idInstance.trim()
    const credentials = {
      idInstance: id,
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: (apiUrl.trim() || deriveApiUrl(id)).replace(/\/+$/, ''),
    }
    setLoading(true)
    setError('')
    try {
      const { stateInstance } = await getStateInstance(credentials)
      if (stateInstance !== 'authorized') {
        throw new Error('Инстанс не авторизован. Отсканируйте QR-код в личном кабинете GREEN-API')
      }
      onLogin(credentials)
    } catch (caught) {
      setError(errorMessage(caught))
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-full place-items-center bg-linear-to-br from-sky to-sea p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[28px] bg-white/85 p-8 shadow-[0_4px_24px_rgb(0_0_0/0.08)] backdrop-blur"
      >
        <h1 className="text-center text-xl font-semibold">Вход в MAX через GREEN-API</h1>
        <p className="mt-2 text-center text-[15px] text-secondary">
          Данные инстанса есть в{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer" className="text-accent hover:underline">
            личном кабинете
          </a>
        </p>
        <div className="mt-6 space-y-3">
          <TextField label="idInstance" value={idInstance} onChange={setIdInstance} required inputMode="numeric" pattern="\d{4,}" autoFocus />
          <TextField label="apiTokenInstance" value={apiTokenInstance} onChange={setApiTokenInstance} required type="password" autoComplete="off" />
          <TextField label="apiUrl (необязательно)" value={apiUrl} onChange={setApiUrl} type="url" placeholder="https://3100.api.green-api.com" />
        </div>
        {error && <p role="alert" className="mt-4 text-sm text-negative">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 h-12 w-full rounded-2xl bg-accent font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </main>
  )
}
