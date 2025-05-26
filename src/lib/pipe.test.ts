import { vi, describe, test, expect } from 'vitest'
import { createPipe } from './pipe'

describe('Pipe', () => {
  test('post and listen messages', () => {
    const pipeA = createPipe<string>('pipe-a')
    const pipeB = createPipe<string>('pipe-b')

    const listenA = vi.fn()
    const listenB = vi.fn()

    pipeA.onPostMessage((payload) => {
      pipeB.listen(payload)
    })

    pipeB.onPostMessage((payload) => {
      pipeA.listen(payload)
    })

    pipeA.addEventListener(listenA)
    pipeB.addEventListener(listenB)

    pipeA.postMessage('Hello from A')

    expect(listenB).toHaveBeenCalledWith('Hello from A')

    pipeB.postMessage('Hello from B')
    expect(listenA).toHaveBeenCalledWith('Hello from B')
  })
})
