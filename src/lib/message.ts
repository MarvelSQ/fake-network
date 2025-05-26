enum ActionType {
  STATE_UPDATE = 'state-update',
  ACTION_UPDATE = 'action-update',
  ACTION_CALL = 'action-call',
  ACTION_ECHO = 'action-echo',
  ACTION_RESULT = 'action-result',
}

type StateUpdate =
  | {
      type: ActionType.STATE_UPDATE
      from: string
      to?: string
      state: Record<string, any>
    }
  | {
      type: ActionType.ACTION_UPDATE
      from: string
      to?: string
      actions: string[]
    }
  | {
      type: ActionType.ACTION_CALL
      from: string
      to: string
      action: string
      actionFor?: string
      messageId: string
      params: ResultCopy
    }
  | {
      type: ActionType.ACTION_ECHO
      from: string
      to: string
      messageId: string
    }
  | {
      type: ActionType.ACTION_RESULT
      from: string
      to: string
      messageId: string
      result: ResultCopy
      resultFor: string
    }

export type Message = StateUpdate

function createResultCopy(result: any) {
  const actions: string[][] = []
  let payload: any

  if (Array.isArray(result)) {
    payload = [...result]
    result.forEach((item, index) => {
      if (typeof item === 'function') {
        actions.push([`${index}`])
      }
    })
  } else if (typeof result === 'object' && result !== null) {
    payload = { ...result }
    Object.keys(result).forEach((key) => {
      if (typeof result[key] === 'function') {
        actions.push([key])
        payload[key] = undefined
      }
    })
  } else if (typeof result === 'function') {
    payload = null
    actions.push([])
  } else {
    payload = result
  }

  return {
    actions,
    payload,
  }
}

type ResultCopy = ReturnType<typeof createResultCopy>

function parseResultCopy(
  result: ResultCopy,
  actionCreator: (action: string) => (...args: any[]) => any,
) {
  const { actions, payload } = result
  if (Array.isArray(actions[0]) && actions[0].length === 0) {
    return actionCreator('')
  }
  actions.forEach((actionPath) => {
    const [actionName] = actionPath

    payload[actionName] = actionCreator(actionName)
  })

  return payload
}

type StateType = Record<string, any>

type ActionsType = Record<string, (...args: any[]) => any>

type Promiseify<T> =
  T extends Promise<infer R>
    ? T
    : T extends (...args: infer A) => infer R
      ? Promise<(...args: A) => Promise<R>>
      : T

type PromiseParams<T extends any[]> = {
  [K in keyof T]: T[K] extends (...args: infer P) => infer R ? (...args: P) => Promiseify<R> : T[K]
}

type PromiseAction<T extends (...args: any[]) => any> = T extends (...args: infer A) => infer R
  ? (...args: PromiseParams<A>) => Promiseify<R>
  : T

type MarkActions<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? PromiseAction<T[K]> : T[K]
}

export function createMessager<
  RS extends StateType,
  RA extends ActionsType,
  S extends StateType = {},
  A extends ActionsType = {},
>(state: S, actions: A, id: string) {
  const messageListener: ((message: Message) => void)[] = []
  const stateListeners: ((state: Record<string, any>) => void)[] = []

  const local = {
    state,
    actions,
  }

  const remotes = {} as Exclude<RS, keyof S>

  const messages: Record<string, any> = {}

  const callers: Record<
    string,
    {
      timeout: number
      retryTimer: NodeJS.Timeout
      resolver: (...args: any[]) => void
      callMessage: Message
    }
  > = {}

  const removeMessageListener = (cb: (message: Message) => void) => {
    const index = messageListener.indexOf(cb)
    if (index !== -1) {
      messageListener.splice(index, 1)
    }
  }

  const removeStateListener = (cb: (state: Record<string, any>) => void) => {
    const index = stateListeners.indexOf(cb)
    if (index !== -1) {
      stateListeners.splice(index, 1)
    }
  }

  const postMessage = (message: Message) => {
    messageListener.forEach((listener) => {
      listener(message)
    })
  }

  const generateMessageId = (to: string) => {
    return `${id}-${to}-${new Date().getTime()}-${Math.random().toString(36).substring(2, 15)}`
  }

  const retryCall = (messageId: string) => {
    const caller = callers[messageId]
    if (caller) {
      caller.timeout <<= 1
      postMessage(caller.callMessage)

      caller.retryTimer = setTimeout(() => {
        retryCall(messageId)
      }, caller.timeout)
    }
  }

  const callAction = (action: string, params: any[], to: string, sourceMessageId?: string) => {
    return new Promise((resolve) => {
      const paramsResult = handleResult(params, to)
      const callMessage: Message = {
        type: ActionType.ACTION_CALL,
        from: id,
        to,
        action,
        actionFor: sourceMessageId,
        messageId: paramsResult.messageId,
        params: paramsResult.resultCopy,
      }

      callers[paramsResult.messageId] = {
        timeout: 8,
        retryTimer: setTimeout(() => {
          retryCall(paramsResult.messageId)
        }, 8),
        resolver: resolve,
        callMessage,
      }
      postMessage(callMessage)
    })
  }

  const actionsProxy = new Proxy<Record<string, (...args: any[]) => any>>(
    {},
    {
      get: (target, prop: string) => {
        if (prop in target) {
          return target[prop]
        } else {
          const func = (...args: any[]) => {
            return callAction(prop, args, 'all')
          }

          target[prop] = func

          return func
        }
      },
    },
  ) as MarkActions<Exclude<RA, keyof A>>

  const handleResult = (result: any, from: string) => {
    const resultCopy = createResultCopy(result)
    const messageId = generateMessageId(from)

    // If the result has actions, we store it in messages for posisible future calls
    if (resultCopy.actions.length) {
      messages[messageId] = result
    }

    return {
      resultCopy,
      messageId,
    }
  }

  return {
    // messaging
    onPostMessage: (cb: (message: Message) => void) => {
      messageListener.push(cb)
      cb({
        type: ActionType.STATE_UPDATE,
        from: id,
        state: local.state,
      })
      return () => removeMessageListener(cb)
    },
    listen: (message: Message) => {
      if (message.type === ActionType.STATE_UPDATE) {
        if (message.from === id) return
        if (message.to && message.to !== id) return
        if (!message.to) {
          postMessage({
            type: ActionType.STATE_UPDATE,
            from: id,
            to: message.from,
            state: local.state,
          })
        }
        Object.keys(message.state).forEach((key) => {
          // @ts-ignore
          // we assume that the state keys are the same as the remote state keys
          remotes[key] = message.state[key]
        })
        stateListeners.forEach((cb) => {
          cb(remotes)
        })
      } else if (message.type === ActionType.ACTION_CALL) {
        const { messageId: sourceMessageId, actionFor, action } = message
        const isCallForMessage = actionFor && actionFor in messages
        const callTarget = isCallForMessage ? messages[actionFor] : local.actions
        const callFunction = action === '' ? callTarget : callTarget[action]
        if (callFunction) {
          const restoredParams = parseResultCopy(message.params, (actionName) => {
            return (...args: any[]) => {
              return callAction(actionName, args, message.from, sourceMessageId)
            }
          })

          postMessage({
            type: ActionType.ACTION_ECHO,
            from: id,
            to: message.from,
            messageId: sourceMessageId,
          })

          Promise.resolve(callFunction(...restoredParams)).then((result) => {
            const formatResult = handleResult(result, message.from)

            postMessage({
              type: ActionType.ACTION_RESULT,
              from: id,
              to: message.from,
              messageId: formatResult.messageId,
              result: formatResult.resultCopy,
              resultFor: sourceMessageId,
            })
          })
        }
      } else if (message.type === ActionType.ACTION_ECHO) {
        const { messageId } = message
        if (callers[messageId]) {
          callers[messageId].timeout = 0
          clearTimeout(callers[messageId].retryTimer)
        }
      } else if (message.type === ActionType.ACTION_RESULT) {
        const { messageId, result, resultFor } = message
        if (callers[resultFor]) {
          const restoredResult = parseResultCopy(result, (actionName) => {
            return (...args: any[]) => {
              return callAction(actionName, args, message.from, messageId)
            }
          })
          callers[resultFor].resolver(restoredResult)
          delete callers[resultFor]
        }
      }
    },
    local,
    remotes,
    actions: actionsProxy,
    onStateUpdate: (cb: (state: Record<string, any>) => void) => {
      stateListeners.push(cb)
    },
    removeStateListener,
  }
}
