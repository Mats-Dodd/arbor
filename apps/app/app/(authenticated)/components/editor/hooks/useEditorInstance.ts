import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState, useEffect } from 'react'
import type { LoroDoc } from 'loro-crdt'
import { createLoroExtension } from '../loro'
import { EDITOR_CONFIG } from '../config/editor-config'
import { getWordCount } from '../utils/text-analysis'

interface UseEditorInstanceProps {
  loroDoc: LoroDoc | null
  onUpdate?: () => void
}

interface UseEditorInstanceReturn {
  editor: ReturnType<typeof useEditor>
  wordCount: number
}

export const useEditorInstance = ({ 
  loroDoc, 
  onUpdate 
}: UseEditorInstanceProps): UseEditorInstanceReturn => {
  const [wordCount, setWordCount] = useState(0)

  const editor = useEditor({
    extensions: loroDoc 
      ? [StarterKit, createLoroExtension(loroDoc)] 
      : [StarterKit],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: EDITOR_CONFIG.EDITOR_CLASSES.container
      }
    },
    onUpdate: ({ editor }) => {
      if (!loroDoc) return
      
      const text = editor.state.doc.textContent
      const words = getWordCount(text)
      
      loroDoc.commit()
      setWordCount(words)
      
      // Call the onUpdate callback if provided
      onUpdate?.()
    }
  }, [loroDoc, onUpdate])

  // Update word count when editor content changes
  useEffect(() => {
    if (editor) {
      const text = editor.state.doc.textContent
      setWordCount(getWordCount(text))
    }
  }, [editor])

  return { editor, wordCount }
} 