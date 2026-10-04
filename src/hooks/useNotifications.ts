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
    void pollNotifications(creds, controller.signal, onMessage, setOnline)
    return () => controller.abort()
  }, [creds, dispatch])

  return online
}
