import { createMessager, Message } from './message'
import { createPipe } from './pipe'

enum StoreType {
  Background = 'background',
  ContentScript = 'content-script',
  Popup = 'popup',
  Options = 'options',
  DevTools = 'devtools',
  SidePanel = 'side-panel',
  UserScript = 'user-script',
}

export function createStore(type: StoreType) {
  const message = createMessager({}, {}, type)
  const pipe = createPipe<Message>(type)

  message.onPostMessage((message) => {
    pipe.postMessage(message, type)
  })

  pipe.addEventListener((payload) => {
    message.listen(payload)
  })

  return {
    pipe,
    message,
  }
}
