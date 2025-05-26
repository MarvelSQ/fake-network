import { vi, describe, test, expect } from 'vitest'
import { createMessager } from './message'

describe('Message', () => {
  test('message between two endpoints', async () => {
    const action1 = vi.fn()
    const action2 = vi.fn()
    const action3 = vi.fn()
    const action4 = vi.fn()
    type State = {}
    type Actions = {
      action1: (arg1: string, arg2: string) => Promise<void>
      action2: (arg1: string) => () => string
      action3: (arg1: string, arg2: string) => Promise<void>
      action4: (callback: () => string) => Promise<string>
    }
    const sideA = createMessager<State, Actions>(
      {
        mocked: false,
      },
      {
        action1,
        action2,
      },
      'side-a',
    )
    const sideB = createMessager<State, Actions>(
      {
        enabled: true,
      },
      {
        action3,
        action4,
      },
      'side-b',
    )

    const stateListenerA = vi.fn()
    const stateListenerB = vi.fn()

    sideA.onStateUpdate(stateListenerA)
    sideB.onStateUpdate(stateListenerB)

    sideA.onPostMessage((message) => {
      sideB.listen(message)
    })

    sideB.onPostMessage((message) => {
      sideA.listen(message)
    })

    expect(stateListenerA).toBeCalledWith({
      enabled: true,
    })

    expect(stateListenerB).toBeCalledWith({
      mocked: false,
    })

    const firstResult = await sideA.actions.action3('test1', 'test2')

    expect(action3).toHaveBeenCalledWith('test1', 'test2')
    expect(firstResult).toBeUndefined()

    const result = vi.fn().mockReturnValue('result callback')

    action2.mockResolvedValue(result)

    const secondResult = await sideB.actions.action2('test3')

    expect(action2).toHaveBeenCalledWith('test3')
    expect(secondResult).toBeInstanceOf(Function)

    const secondResultResponse = await secondResult()

    expect(secondResultResponse).toBe('result callback')

    action4.mockImplementation((fn) => {
      return fn()
    })

    const action4Callback = vi.fn().mockImplementation(() => {
      return 'action4 result'
    })
    const thirdResult = await sideA.actions.action4(action4Callback)

    expect(thirdResult).toBe('action4 result')
  })

  test('message retry call', async () => {
    const action1 = vi.fn()
    const action2 = vi.fn().mockReturnValue('action2 result')
    const sideA = createMessager(
      {},
      {
        action1,
      },
      'side-a',
    )
    const sideB = createMessager(
      {},
      {
        action2,
      },
      'side-b',
    )

    setTimeout(() => {
      sideA.onPostMessage((message) => {
        sideB.listen(message)
      })

      sideB.onPostMessage((message) => {
        sideA.listen(message)
      })
    }, 1000)

    const result = await sideA.actions.action2('test1', 'test2')

    expect(result).toBe('action2 result')
  })
})
