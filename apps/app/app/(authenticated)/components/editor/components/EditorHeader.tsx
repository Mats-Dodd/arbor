import Link from 'next/link'
import { EDITOR_CONFIG } from '../config/editor-config'

interface EditorHeaderProps {
  title: string
  onTitleChange: (title: string) => void
}

export const EditorHeader = ({ title, onTitleChange }: EditorHeaderProps) => {
  return (
    <>
      {/* Back button */}
      <Link 
        href="/" 
        className={EDITOR_CONFIG.LAYOUT_CLASSES.backButton}
      >
        ← Back to documents
      </Link>
      
      {/* Title Input */}
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={EDITOR_CONFIG.DEFAULT_TITLE}
        className={EDITOR_CONFIG.LAYOUT_CLASSES.titleInput}
      />
    </>
  )
} 