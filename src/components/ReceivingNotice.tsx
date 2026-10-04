import { useEffect, useState } from 'react'
import {
  enableIncomingWebhook,
  errorMessage,
  getSettings,
  receivingProblem,
  type ReceivingProblem,
} from '../api/green-api'
import type { Credentials } from '../types'

type Status = ReceivingProblem | 'enabling' | 'enabled' | 'failed' | null

interface Props {
  readonly credentials: Credentials
}

export function ReceivingNotice({ credentials }: Props) {
  const [status, setStatus] = useState<Status>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    getSettings(credentials)
      .then((settings) => {
        if (active) setStatus(receivingProblem(settings))
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(errorMessage(caught))
          setStatus('failed')
        }
      })
    return () => {
      active = false
    }
  }, [credentials, attempt])

  const retry = () => {
    setError('')
    setStatus(null)
    setAttempt((value) => value + 1)
  }

  const enable = async () => {
    setStatus('enabling')
    setError('')
    try {
      await enableIncomingWebhook(credentials)
      setStatus('enabled')
    } catch (caught) {
      setError(errorMessage(caught))
      setStatus('disabled')
    }
  }

  if (!status) return null

  return (
    <div role="status" className="mx-3 mb-2 rounded-xl bg-accent/10 px-3 py-2 text-[13px]">
      {status === 'webhook' &&
        'В инстансе задан webhookUrl, и входящие сообщения уходят туда. Очистите его в личном кабинете GREEN-API.'}
      {status === 'enabled' && 'Приём входящих включён. GREEN-API применит настройку в течение 5 минут.'}
      {status === 'failed' && (
        <>
          <p>Не удалось проверить настройки приёма входящих.</p>
          <p className="mt-1 text-negative">{error}</p>
          <button type="button" onClick={retry} className="mt-1.5 font-medium text-accent hover:underline">
            Проверить снова
          </button>
        </>
      )}
      {(status === 'disabled' || status === 'enabling') && (
        <>
          <p>Приём входящих сообщений выключен в настройках инстанса.</p>
          {error && <p className="mt-1 text-negative">{error}</p>}
          <button
            type="button"
            onClick={enable}
            disabled={status === 'enabling'}
            className="mt-1.5 font-medium text-accent hover:underline disabled:opacity-60"
          >
            {status === 'enabling' ? 'Включаем…' : 'Включить'}
          </button>
        </>
      )}
    </div>
  )
}
