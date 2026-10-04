import { afterEach, describe, expect, it, vi } from 'vitest'
import { pollNotifications } from './poll'

const creds = { apiUrl: 'https://3100.api.green-api.com', idInstance: '3100000001', apiTokenInstance: 'token' }

const textBody = {
  typeWebhook: 'incomingMessageReceived',
  idMessage: 'm1',
  timestamp: 1,
  senderData: { chatId: '10' },
  messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'hi' } },
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('pollNotifications', () => {
  it('passes text messages on and deletes every notification', async () => {
    const controller = new AbortController()
    const bodies: unknown[] = [{ typeWebhook: 'stateInstanceChanged' }, textBody]
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/deleteNotification/')) return new Response('{"result":true}')
      const body = bodies.shift()
      if (!body) controller.abort()
      return new Response(body ? JSON.stringify({ receiptId: 7, body }) : 'null')
    })
    vi.stubGlobal('fetch', fetchMock)
    const onMessage = vi.fn()

    await pollNotifications(creds, controller.signal, onMessage, () => {})

    expect(onMessage).toHaveBeenCalledOnce()
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ chatId: '10', text: 'hi' }))
    expect(fetchMock.mock.calls.filter(([url]) => url.includes('/deleteNotification/'))).toHaveLength(2)
  })

  it('goes offline on a network error and retries', async () => {
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const controller = new AbortController()
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockImplementationOnce(async () => {
        controller.abort()
        return new Response('null')
      })
    vi.stubGlobal('fetch', fetchMock)
    const onOnline = vi.fn()

    const polling = pollNotifications(creds, controller.signal, vi.fn(), onOnline)
    await vi.advanceTimersByTimeAsync(5000)
    await polling

    expect(onOnline.mock.calls).toEqual([[false], [true]])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
