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
    await vi.advanceTimersByTimeAsync(4999)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    await polling

    expect(onOnline.mock.calls).toEqual([[false], [true]])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('stays quiet when aborted during a request', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const controller = new AbortController()
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('This operation was aborted', 'AbortError')))))
    vi.stubGlobal('fetch', fetchMock)
    const onOnline = vi.fn()

    const polling = pollNotifications(creds, controller.signal, vi.fn(), onOnline)
    controller.abort()
    await polling

    expect(onOnline).not.toHaveBeenCalledWith(false)
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('settles at once when aborted during the retry wait', async () => {
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const controller = new AbortController()
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)
    const onOnline = vi.fn()

    const polling = pollNotifications(creds, controller.signal, vi.fn(), onOnline)
    await vi.advanceTimersByTimeAsync(0)
    expect(vi.getTimerCount()).toBe(1)
    controller.abort()
    await polling

    expect(vi.getTimerCount()).toBe(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
