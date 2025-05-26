/**
 * message pipe for multiple endpoints
 *
 * every endpoint can transport messages to other endpoints
 */

export type Payload<T> = {
  from: string
  to: string | undefined
  uniqueId: string
  message: T
}

export function createPipe<T>(id: string) {
  const payloads: Payload<T>[] = []
  const cbs: ((payload: Payload<T>) => void)[] = []
  const onMessages: ((message: T) => void)[] = []

  const removePoster = (cb: (payload: Payload<T>) => void) => {
    const index = cbs.indexOf(cb)
    if (index !== -1) {
      cbs.splice(index, 1)
    }
  }

  const removeListener = (cb: (message: T) => void) => {
    const index = onMessages.indexOf(cb)
    if (index !== -1) {
      onMessages.splice(index, 1)
    }
  }

  const postMessage = (message: T, to?: string) => {
    const payload: Payload<T> = {
      from: id,
      to,
      uniqueId: `${id}-${to}-${Math.random().toString(36).substring(2, 15)}`,
      message,
    }
    payloads.push(payload)
    cbs.forEach((cb) => {
      cb(payload)
    })
  }

  return {
    listen: (payload: Payload<T>) => {
      if (payloads.some((p) => p.uniqueId === payload.uniqueId)) {
        return
      }
      payloads.push(payload)
      // redirect to other endpoints
      cbs.forEach((cb) => {
        cb(payload)
      })
      if (!payload.to || payload.to === id) {
        onMessages.forEach((cb) => {
          cb(payload.message)
        })
      }
    },
    postMessage,
    addEventListener: (cb: (payload: T) => void) => {
      onMessages.push(cb)
      return () => {
        removeListener(cb)
      }
    },
    onPostMessage: (cb: (payload: Payload<T>) => void) => {
      cbs.push(cb)

      return () => {
        removePoster(cb)
      }
    },
  }
}
