export interface Credentials {
  readonly apiUrl: string
  readonly idInstance: string
  readonly apiTokenInstance: string
}

export interface Chat {
  readonly chatId: string
  readonly phone?: string
  readonly name?: string
}

export interface Message {
  readonly id: string
  readonly chatId: string
  readonly text: string
  readonly timestamp: number
  readonly outgoing: boolean
  readonly status?: 'pending' | 'failed'
  readonly error?: string
}
