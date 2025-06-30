'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState, useEffect } from 'react'
import 'app/styles/editor.css'

const Editor = () => {
  const [title, setTitle] = useState('')
  const [wordCount, setWordCount] = useState(0)
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[calc(100vh-16rem)]'
      }
    },
    onUpdate: ({ editor }) => {
      const text = editor.state.doc.textContent
      const words = text.trim().split(/\s+/).filter(word => word.length > 0)
      setWordCount(words.length)
    }
  })

  useEffect(() => {
    const savedTitle = localStorage.getItem('editor-title')
    if (savedTitle) setTitle(savedTitle)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('editor-title', title)
    }, 500)
    return () => clearTimeout(timer)
  }, [title])

  if (!editor) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-12 py-8 sm:px-16 sm:py-12 md:px-20 md:py-16">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="w-full bg-transparent text-2xl sm:text-3xl font-semibold text-foreground placeholder:text-muted-foreground/60 focus:outline-none mb-6 sm:mb-8 tracking-tight"
        />
        
        {/* Editor Content */}
        <div className="relative">
          <EditorContent 
            editor={editor} 
            className="text-foreground [&_.ProseMirror]:min-h-[calc(100vh-20rem)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-['Start_writing...'] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground/50 [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
          />
        </div>
        
        {/* Word count indicator */}
        <div className="fixed bottom-6 right-6 text-sm text-muted-foreground/60">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </div>
      </div>
    </div>
  )
}

export default Editor
