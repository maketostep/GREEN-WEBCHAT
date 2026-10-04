import { useEffect, useState, type Dispatch } from 'react'
import type { ChatAction } from '../lib/chat-state'
import type { IncomingText } from '../lib/notification'
import { pollNotifications } from '../lib/poll'
import type { Credentials } from '../types'

export function useNotifications(creds: Credentials, dispatch: Dispatch<ChatAction>): boolean {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const onMessage = ({ idMessage, chatId, chatName, text, timestamp }: IncomingText) =>
      dispatch({ type: 'messageAdded', chatName, message: { id: idMessage, chatId, text, timestamp, outgoing: false } })
    const poll = () => pollNotifications(creds, controller.signal, onMessage, setOnline)
    const run = navigator.locks
      ? navigator.locks.request(`green-chat:poll:${creds.idInstance}`, { signal: controller.signal }, poll)
      : poll()
    run.catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) console.error(error)
    })
    return () => controller.abort()
  }, [creds, dispatch])

  return online
}
