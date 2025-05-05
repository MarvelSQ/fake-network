export type NetRequest = {
  id: string
  url: string
  method: string
  status: number
  statusText: string
  request: {
    headers: Record<string, string>
    body: string
  }
  response: {
    duration: number
    body: string
  }
  timestamp: number
}
