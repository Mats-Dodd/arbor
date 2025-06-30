'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import 'app/styles/editor.css'
import { LoroExtension, loroDoc } from './loro'

interface EditorProps {
  nodeId?: string;
}

const Editor = ({ nodeId = 'doc-node-1' }: EditorProps) => {
  const [title, setTitle] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load snapshot on mount
  useEffect(() => {
    const loadSnapshot = async () => {
      try {
        const response = await fetch(`/api/nodes/${nodeId}`)
        if (response.ok) {
          const node = await response.json()
          if (node.loroSnapshot) {
            // Convert base64 back to Uint8Array and import
            const snapshotBytes = Uint8Array.from(atob(node.loroSnapshot), c => c.charCodeAt(0))
            loroDoc.import(snapshotBytes)
            console.log('[EDITOR] Loaded snapshot successfully')
          }
          if (node.name) {
            setTitle(node.name)
          }
        } else if (response.status === 404) {
          // Node doesn't exist yet - create it
          await createNode()
        }
      } catch (error) {
        console.error('[EDITOR] Failed to load snapshot:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSnapshot()
  }, [nodeId])

  const createNode = async () => {
    try {
      // First create the node via database directly
      // For now we'll skip this and assume the node exists
      console.log('[EDITOR] Node needs to be created first')
    } catch (error) {
      console.error('[EDITOR] Failed to create node:', error)
    }
  }

  const saveSnapshot = useCallback(async () => {
    try {
      setIsSaving(true)
      const snapshot = loroDoc.export({ mode: "snapshot" })
      // Convert Uint8Array to base64 for transmission
      const snapshotBase64 = btoa(String.fromCharCode(...snapshot))
      
      await fetch(`/api/nodes/${nodeId}/snapshot`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot: snapshotBase64 })
      })
      
      console.log('[EDITOR] Snapshot saved successfully')
    } catch (error) {
      console.error('[EDITOR] Failed to save snapshot:', error)
    } finally {
      setIsSaving(false)
    }
  }, [])

  const debouncedSave = useCallback(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Set new timeout for 2 seconds
    saveTimeoutRef.current = setTimeout(() => {
      saveSnapshot()
    }, 2000)
  }, [saveSnapshot])

  console.log('[EDITOR.tsx] loroDoc.toJSON()', loroDoc.toJSON())
  
  const editor = useEditor({
    extensions: [StarterKit, LoroExtension],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[calc(100vh-16rem)]'
      }
    },
    onUpdate: ({ editor }) => {
      const text = editor.state.doc.textContent
      const words = text.trim().split(/\s+/).filter(word => word.length > 0)
      console.log('[EDITOR.tsx] called commit()')
      loroDoc.commit()
      setWordCount(words.length)
      
      // Trigger debounced save
      debouncedSave()
    }
  })

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

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

  if (isLoading || !editor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading document...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-12 py-8 sm:px-16 sm:py-12 md:px-20 md:py-16">
        {/* Back button */}
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          ← Back to documents
        </Link>
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
        
        {/* Status indicators */}
        <div className="fixed bottom-6 right-6 flex items-center gap-4">
          {isSaving && (
            <span className="text-sm text-muted-foreground/60">Saving...</span>
          )}
          <span className="text-sm text-muted-foreground/60">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Editor
