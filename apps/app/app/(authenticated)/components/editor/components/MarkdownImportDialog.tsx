'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/design-system/components/ui/dialog'
import { Button } from '@repo/design-system/components/ui/button'
import { Textarea } from '@repo/design-system/components/ui/textarea'
import { toast } from 'sonner'
import { LoroDoc } from 'loro-crdt'
import { markdownToJSON, validateMarkdownContent } from '../utils/markdown-converter'
import { exportSnapshot } from '../utils/snapshot'
import { NodeApiService } from '../services/node-api'

interface MarkdownImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const MarkdownImportDialog = ({ open, onOpenChange }: MarkdownImportDialogProps) => {
  const [markdownContent, setMarkdownContent] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const router = useRouter()

  const handleImport = async () => {
    if (!validateMarkdownContent(markdownContent)) {
      toast.error('Please enter some markdown content')
      return
    }

    setIsImporting(true)

    try {
      const prosemirrorJson = markdownToJSON(markdownContent)
      console.log('[MARKDOWN_IMPORT_DIALOG] prosemirrorJson', prosemirrorJson)
      
      const loroDoc = new LoroDoc()
      
      const { Editor } = await import('@tiptap/core')
      const StarterKit = await import('@tiptap/starter-kit')
      const { createLoroExtension } = await import('../loro')
      
      const tempEditor = new Editor({
        extensions: [
          StarterKit.default,
          createLoroExtension(loroDoc)
        ],
        content: prosemirrorJson
      })
      tempEditor.commands.setContent(prosemirrorJson)
      
      await new Promise(resolve => setTimeout(resolve, 1000))

      loroDoc.commit()
      
      tempEditor.destroy()

      const snapshot = exportSnapshot(loroDoc)
      console.log('[MARKDOWN_IMPORT_DIALOG] loro json', loroDoc.toJSON())
      if (!snapshot) {
        throw new Error('Failed to create snapshot')
      }
      
      const nodeId = crypto.randomUUID()
      
      await NodeApiService.createNode(nodeId, {
        name: 'Imported Document',
        loroSnapshot: snapshot
      })
      
      toast.success('Document imported successfully')
      router.push(`/node/${nodeId}`)
      
      onOpenChange(false)
      setMarkdownContent('')
    } catch (error) {
      console.error('Import failed:', error)
      toast.error('Failed to import document. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Markdown</DialogTitle>
          <DialogDescription>
            Paste your markdown content below to create a new document.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea
            placeholder="# Welcome to my document&#10;&#10;Paste your markdown content here..."
            value={markdownContent}
            onChange={(e) => setMarkdownContent(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={isImporting || !markdownContent.trim()}
          >
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 