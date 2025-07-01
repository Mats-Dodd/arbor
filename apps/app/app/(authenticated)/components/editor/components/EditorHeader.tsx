'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { Button } from '@repo/design-system/components/ui/button'
import { EDITOR_CONFIG } from '../config/editor-config'
import { MarkdownImportDialog } from './MarkdownImportDialog'

interface EditorHeaderProps {
  title: string
  onTitleChange: (title: string) => void
}

export const EditorHeader = ({ title, onTitleChange }: EditorHeaderProps) => {
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Link 
          href="/" 
          className={EDITOR_CONFIG.LAYOUT_CLASSES.backButton}
        >
          ← Back to documents
        </Link>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setImportDialogOpen(true)}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Import Markdown
        </Button>
      </div>
      
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={EDITOR_CONFIG.DEFAULT_TITLE}
        className={EDITOR_CONFIG.LAYOUT_CLASSES.titleInput}
      />
      
      <MarkdownImportDialog 
        open={importDialogOpen} 
        onOpenChange={setImportDialogOpen} 
      />
    </>
  )
} 