import { EditorContent as TiptapEditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import { EDITOR_CONFIG } from '../config/editor-config'

interface EditorContentProps {
  editor: Editor
}

export const EditorContent = ({ editor }: EditorContentProps) => {
  return (
    <div className="relative">
      <TiptapEditorContent 
        editor={editor} 
        className={EDITOR_CONFIG.EDITOR_CLASSES.wrapper}
      />
    </div>
  )
} 