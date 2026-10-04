import { deleteNotification, receiveNotification } from '../api/green-api'
import type { Credentials } from '../types'
import { parseIncomingText, type IncomingText } from './notification'

const RETRY_DELAY_MS = 5000

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', done)
      resolve()
    }
    const timer = setTimeout(done, ms)
    if (signal.aborted) done()
    else signal.addEventListener('abort', done, { once: true })
  })
}

export async function pollNotifications(
  creds: Credentials,
  signal: AbortSignal,
  onMessage: (message: IncomingText) => void,
  onOnline: (online: boolean) => void,
): Promise<void> {
  while (!signal.aborted) {
    try {
      const notification = await receiveNotification(creds, signal)
      onOnline(true)
      if (!notification) continue
      const message = parseIncomingText(notification.body)
      if (message) onMessage(message)
      // Каждое уведомление нужно удалять, иначе очередь встанет на нём
      await deleteNotification(creds, notification.receiptId, signal)
    } catch (error) {
      if (signal.aborted) return
      console.error(error)
      onOnline(false)
      await wait(RETRY_DELAY_MS, signal)
    }
  }
}
