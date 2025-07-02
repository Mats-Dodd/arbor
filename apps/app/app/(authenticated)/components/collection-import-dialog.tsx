'use client'

import { useState, useRef } from 'react'
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
import { Input } from '@repo/design-system/components/ui/input'
import { Label } from '@repo/design-system/components/ui/label'
import { Progress } from '@repo/design-system/components/ui/progress'
import { toast } from 'sonner'
import { Upload, FolderOpen } from 'lucide-react'
import { CollectionApiService } from './editor/services/collection-api'

interface CollectionImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FileWithPath extends File {
  webkitRelativePath: string
}

export const CollectionImportDialog = ({ open, onOpenChange }: CollectionImportDialogProps) => {
  const [collectionName, setCollectionName] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<FileWithPath[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const markdownFiles = Array.from(files).filter(file => 
      file.name.endsWith('.md') || file.name.endsWith('.markdown')
    )

    if (markdownFiles.length === 0) {
      toast.error('Please select at least one markdown file')
      return
    }

    setSelectedFiles(markdownFiles as FileWithPath[])
  }

  const handleImport = async () => {
    if (!collectionName.trim()) {
      toast.error('Please enter a collection name')
      return
    }

    if (selectedFiles.length === 0) {
      toast.error('Please select files to import')
      return
    }

    setIsImporting(true)
    setImportProgress(0)

    try {
      const result = await CollectionApiService.importCollection(
        selectedFiles,
        collectionName,
        (progress: number) => setImportProgress(progress)
      )

      toast.success(`Collection "${collectionName}" imported successfully`)
      router.push(`/collection/${result.collectionId}`)
      
      // Reset dialog state
      onOpenChange(false)
      setCollectionName('')
      setSelectedFiles([])
      setImportProgress(0)
    } catch (error) {
      console.error('Import failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import collection')
    } finally {
      setIsImporting(false)
    }
  }

  const handleReset = () => {
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Collection</DialogTitle>
          <DialogDescription>
            Select a folder containing markdown files to create a new collection with the same folder structure.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Collection Name Input */}
          <div className="space-y-2">
            <Label htmlFor="collection-name">Collection Name</Label>
            <Input
              id="collection-name"
              placeholder="My Collection"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              disabled={isImporting}
            />
          </div>

          {/* File Selection */}
          <div className="space-y-2">
            <Label>Select Files</Label>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                // @ts-ignore - webkitdirectory is not in the types but works
                webkitdirectory=""
                multiple
                accept=".md,.markdown"
                onChange={handleFileSelection}
                className="hidden"
                disabled={isImporting}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="w-full justify-start gap-2"
              >
                <FolderOpen className="h-4 w-4" />
                Select Folder with Markdown Files
              </Button>
            </div>
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Selected Files ({selectedFiles.length})</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={isImporting}
                >
                  Clear
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-md border p-3 text-sm">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="text-muted-foreground">
                    {file.webkitRelativePath || file.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-2">
              <Label>Import Progress</Label>
              <Progress value={importProgress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Processing {Math.round(importProgress)}%...
              </p>
            </div>
          )}
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
            disabled={isImporting || !collectionName.trim() || selectedFiles.length === 0}
          >
            {isImporting ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              'Import Collection'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 