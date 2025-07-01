'use client'

import { useCallback } from 'react'
import 'app/styles/editor.css'
import { EDITOR_CONFIG } from './config/editor-config'
import { useLoroDocument } from './hooks/useLoroDocument'
import { useDocumentPersistence } from './hooks/useDocumentPersistence'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import { useEditorInstance } from './hooks/useEditorInstance'
import { 
  LoadingState, 
  EditorHeader, 
  EditorContent, 
  EditorStatusBar 
} from './components'

interface EditorProps {
  nodeId?: string
}

const Editor = ({ nodeId = EDITOR_CONFIG.DEFAULT_NODE_ID }: EditorProps) => {
  // Load document
  const { loroDoc, isLoading, error, nodeTitle } = useLoroDocument(nodeId)
  
  // Document persistence
  const { 
    isSaving, 
    lastSaved, 
    error: saveError,
    debouncedSave 
  } = useDocumentPersistence({ loroDoc, nodeId })
  
  // Title management
  const { title, setTitle } = useDocumentTitle({ 
    initialTitle: nodeTitle, 
    nodeId 
  })
  
  // Handle editor updates
  const handleEditorUpdate = useCallback(() => {
    debouncedSave()
  }, [debouncedSave])
  
  // Editor instance
  const { editor, wordCount } = useEditorInstance({ 
    loroDoc, 
    onUpdate: handleEditorUpdate 
  })

  // Show loading state
  if (isLoading || !loroDoc || !editor) {
    return <LoadingState />
  }

  return (
    <div className={EDITOR_CONFIG.LAYOUT_CLASSES.page}>
      <div className={EDITOR_CONFIG.LAYOUT_CLASSES.content}>
        <EditorHeader 
          title={title} 
          onTitleChange={setTitle} 
        />
        
        <EditorContent editor={editor} />
        
        <EditorStatusBar 
          wordCount={wordCount}
          isSaving={isSaving}
          lastSaved={lastSaved}
          error={saveError || error}
        />
      </div>
    </div>
  )
}

export default Editor
