import { editor } from 'monaco-editor'
import { Editor as MonacoEditor, Monaco, loader } from '@monaco-editor/react'
import { useRef } from 'react'

import './loader'

export function Editor({
  value,
  language,
  onChange,
}: {
  value?: string
  language?: string
  onChange: (value: string) => void
}) {
  const editorRef = useRef<editor.IStandaloneCodeEditor>()

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
    editorRef.current = editor
  }

  function handleEditorChange(value: string | undefined, event: editor.IModelContentChangedEvent) {
    console.log('value changed', value)
    onChange(value || '')
  }

  return (
    <MonacoEditor
      theme="mac"
      height="60vh"
      language={language}
      value={value}
      onMount={handleEditorDidMount}
      onChange={handleEditorChange}
    />
  )
}
