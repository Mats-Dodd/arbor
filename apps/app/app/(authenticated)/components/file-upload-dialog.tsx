"use client"

import {
  AlertCircleIcon,
  FileArchiveIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileUpIcon,
  FolderIcon,
  HeadphonesIcon,
  ImageIcon,
  ImportIcon,
  VideoIcon,
  XIcon,
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import {
  formatBytes,
  useFileUpload,
  type FileWithPreview,
} from "@/hooks/use-file-upload"
import { Button } from "@repo/design-system/components/ui/button"
import { mdToPM, markdownToJSON } from "./editor/utils/markdown-converter"
import { LoroDoc } from "loro-crdt"
import { exportSnapshot } from "./editor/utils/snapshot"
import { NodeApiService } from "./editor/services/node-api"
import { toast } from "sonner"



const getFileIcon = (file: { file: File | { type: string; name: string } }) => {
  const fileType = file.file instanceof File ? file.file.type : file.file.type
  const fileName = file.file instanceof File ? file.file.name : file.file.name

  // Markdown files
  if (
    fileName.endsWith(".md") ||
    fileType.includes("markdown") ||
    fileType === "text/x-markdown"
  ) {
    return <FileTextIcon className="size-4 opacity-60" />
  } else if (
    fileType.includes("pdf") ||
    fileName.endsWith(".pdf") ||
    fileType.includes("word") ||
    fileName.endsWith(".doc") ||
    fileName.endsWith(".docx")
  ) {
    return <FileTextIcon className="size-4 opacity-60" />
  } else if (
    fileType.includes("zip") ||
    fileType.includes("archive") ||
    fileName.endsWith(".zip") ||
    fileName.endsWith(".rar")
  ) {
    return <FileArchiveIcon className="size-4 opacity-60" />
  } else if (
    fileType.includes("excel") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".xlsx")
  ) {
    return <FileSpreadsheetIcon className="size-4 opacity-60" />
  } else if (fileType.includes("video/")) {
    return <VideoIcon className="size-4 opacity-60" />
  } else if (fileType.includes("audio/")) {
    return <HeadphonesIcon className="size-4 opacity-60" />
  } else if (fileType.startsWith("image/")) {
    return <ImageIcon className="size-4 opacity-60" />
  }
  return <FileIcon className="size-4 opacity-60" />
}

export default function FileUploadDialog() {
  const maxSize = 100 * 1024 * 1024 // 100MB default
  const maxFiles = 10000
  const [isImporting, setIsImporting] = useState(false)
  const router = useRouter()

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    multiple: true,
    directory: true,
    maxFiles,
    maxSize,
    accept: ".md,text/markdown,text/x-markdown", // Only accept markdown files
    initialFiles: [], // Remove the dummy files since we only want .md files
  })

  const handleImport = async () => {
    setIsImporting(true)
    
    try {
      // Pre-import the modules once to avoid repeated dynamic imports
      const [{ Editor }, StarterKit, { createLoroExtension }] = await Promise.all([
        import('@tiptap/core'),
        import('@tiptap/starter-kit'),
        import('./editor/loro')
      ])

      // Process all files in parallel
      const processFile = async (fileWrapper: FileWithPreview) => {
        if (!(fileWrapper.file instanceof File)) return null
        
        const fileName = fileWrapper.file.name.toLowerCase()
        
        // Double-check that it's a markdown file
        if (!fileName.endsWith('.md')) {
          console.warn(`Skipping non-markdown file: ${fileWrapper.file.name}`)
          return null
        }
        
        // Read the file content
        const content = await fileWrapper.file.text()
        
        // Log file information
        console.log("=== File Import ===")
        console.log("File:", fileWrapper.path || fileWrapper.file.name)
        console.log("Content:")
        console.log(content)
        console.log("==================\n")

        const loroDoc = new LoroDoc()
        const prosemirrorJson = mdToPM(content, loroDoc)
        console.log('[FILE_UPLOAD_DIALOG] prosemirrorJson', prosemirrorJson)
    
        const tempEditor = new Editor({
          extensions: [
            StarterKit.default,
            createLoroExtension(loroDoc)
          ],
          content: prosemirrorJson
        })
        tempEditor.commands.setContent(prosemirrorJson)
    
        // Reduced delay since we're processing in parallel
        await new Promise(resolve => setTimeout(resolve, 100))

        loroDoc.commit()
        console.log('[FILE_UPLOAD_DIALOG] loro json', loroDoc.toJSON())
    
        tempEditor.destroy()
        const snapshot = exportSnapshot(loroDoc)
        if (!snapshot) {
          throw new Error('Failed to create snapshot')
        }
        
        console.log('[FILE_UPLOAD_DIALOG] Snapshot created successfully')
        
        return {
          file: fileWrapper,
          snapshot: snapshot
        }
      }

      // Process all files in parallel
      const results = await Promise.all(
        files.map(processFile)
      )
      
      // Filter out null results (skipped files)
      const processedFiles = results.filter(result => result !== null)
      console.log(`Successfully processed ${processedFiles.length} files`)
      
      // Group files by folder
      const folderStructure: Record<string, FileWithPreview[]> = {}
      files.forEach((file) => {
        if (file.path) {
          const folderPath = file.path.split('/').slice(0, -1).join('/')
          if (!folderStructure[folderPath]) {
            folderStructure[folderPath] = []
          }
          folderStructure[folderPath].push(file)
        }
      })
      
      if (Object.keys(folderStructure).length > 0) {
        console.log("\n=== Folder Structure ===")
        Object.entries(folderStructure).forEach(([folder, files]) => {
          console.log(`Folder: ${folder || 'root'}`)
          console.log(`  Files: ${files.map(f => f.path?.split('/').pop()).join(', ')}`)
        })
        console.log("======================")
      }

      // Save nodes to database
      const folderNodeIds: Record<string, string> = {}
      const savedNodeIds: string[] = []
      
      // Determine the root folder name
      let rootFolderName = 'Imported Documents'
      if (processedFiles.length > 0) {
        if (processedFiles[0]?.file.path) {
          // Get the first part of the path as root folder name
          const firstPath = processedFiles[0].file.path
          const rootName = firstPath.split('/')[0]
          if (rootName) {
            rootFolderName = rootName
          }
        } else if (processedFiles.length === 1) {
          // Single file - use file name without extension
          const fileName = processedFiles[0]?.file.file instanceof File 
            ? processedFiles[0].file.file.name 
            : processedFiles[0]?.file.file.name
          if (fileName) {
            rootFolderName = fileName.replace('.md', '') + ' Collection'
          }
        } else {
          // Multiple files without folders
          rootFolderName = `Import ${new Date().toLocaleDateString()}`
        }
      }
      
      console.log(`\n=== Import Summary ===`)
      console.log(`Collection name: ${rootFolderName}`)
      console.log(`Root directory will be the collection itself`)
      
      // Track if collection has been created
      let createdCollectionId: string | null = null
      
      // First, create folder nodes
      const uniqueFolders = new Set<string>()
      processedFiles.forEach(result => {
        if (result?.file.path) {
          const parts = result.file.path.split('/')
          let currentPath = ''
          // Build all parent folder paths (skip the root which is index 0)
          for (let i = 1; i < parts.length - 1; i++) {
            currentPath = parts.slice(0, i + 1).join('/')
            uniqueFolders.add(currentPath)
          }
        }
      })
      
      // Sort folders by depth to create parent folders first
      const sortedFolders = Array.from(uniqueFolders).sort((a, b) => {
        return a.split('/').length - b.split('/').length
      })
      
      console.log(`Creating ${sortedFolders.length} folders (excluding root)`)
      
      // Create folder nodes
      for (const folderPath of sortedFolders) {
        const folderName = folderPath.split('/').pop() || 'folder'
        const parentPath = folderPath.split('/').slice(0, -1).join('/')
        
        // If parentPath is just the root folder name, don't set a parentId
        const isDirectChildOfRoot = parentPath.split('/').length === 1
        const parentId = isDirectChildOfRoot ? undefined : folderNodeIds[parentPath]
        
        const folderId = crypto.randomUUID()
        folderNodeIds[folderPath] = folderId
        
        try {
          const nodeData: any = {
            name: folderName,
            kind: 'folder' as any,
            parentId: parentId as any,
            metadata: {}
          }
          
          // First node creates the collection
          if (!createdCollectionId) {
            nodeData.collectionName = rootFolderName
          } else {
            nodeData.collectionId = createdCollectionId
          }
          
          const response = await NodeApiService.createNode(folderId, nodeData)
          
          // Store the collection ID from the first created node
          if (!createdCollectionId && response) {
            // We'll need to get the collectionId from the response
            createdCollectionId = response.collectionId || null
          }
        } catch (error) {
          console.error(`Failed to create folder ${folderName}:`, error)
        }
      }
      
      // Create file nodes
      for (const result of processedFiles) {
        if (!result) continue
        
        const fileName = result.file.path?.split('/').pop() || 
                        (result.file.file instanceof File ? result.file.file.name : result.file.file.name)
        const folderPath = result.file.path?.split('/').slice(0, -1).join('/') || ''
        
        // Only set parentId if the file is not in the root directory
        let parentId: string | undefined = undefined
        if (folderPath && folderPath.split('/').length > 1) {
          // File is in a subdirectory
          parentId = folderNodeIds[folderPath]
          console.log(`[FILE_NODE_CREATION] ${fileName} is in subdirectory: ${folderPath}`)
        } else {
          console.log(`[FILE_NODE_CREATION] ${fileName} is in root directory`)
        }
        // If folderPath has only one part, it's in the root directory of the collection
        
        const nodeId = crypto.randomUUID()
        
        // Use the pre-generated snapshot directly
        console.log(`[FILE_NODE_CREATION] Processing ${fileName}`)
        
        if (!result.snapshot) {
          console.error(`[FILE_NODE_CREATION] No snapshot available for ${fileName}`)
          continue
        }
        
        const snapshot = result.snapshot
        console.log('[FILE_NODE_CREATION] Using pre-generated snapshot')
        
        try {
          const nodeData: any = {
            name: fileName.replace('.md', ''),
            kind: 'file' as any,
            loroSnapshot: snapshot,
            parentId: parentId as any,
            metadata: {}
          }
          
          // First node creates the collection if not already created
          if (!createdCollectionId) {
            nodeData.collectionName = rootFolderName
          } else {
            nodeData.collectionId = createdCollectionId
          }
          
          const response = await NodeApiService.createNode(nodeId, nodeData)
          
          // Store the collection ID from the first created node
          if (!createdCollectionId && response) {
            createdCollectionId = response.collectionId || null
          }
          
          savedNodeIds.push(nodeId)
        } catch (error) {
          console.error(`Failed to create node for ${fileName}:`, error)
        }
      }
      
      toast.success(`Successfully imported ${savedNodeIds.length} files`)
      
      console.log(`\n=== Import Complete ===`)
      console.log(`Created collection: ${rootFolderName}`)
      console.log(`Created ${sortedFolders.length} folders`)
      console.log(`Created ${savedNodeIds.length} files`)
      console.log(`First file ID: ${savedNodeIds[0] || 'none'}`)
      console.log(`======================\n`)
      
      // Navigate to the first imported file
      if (savedNodeIds.length > 0) {
        router.push(`/node/${savedNodeIds[0]}`)
      }
      
      // Clear files after successful import
      clearFiles()
    } catch (error) {
      console.error("Error importing files:", error)
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Drop area */}
      <div
        role="button"
        onClick={openFileDialog}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={isDragging || undefined}
        className="border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed p-4 transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:ring-[3px]"
      >
        <input
          {...getInputProps()}
          className="sr-only"
          aria-label="Upload files or folders"
        />

        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex gap-2 mb-2">
            <div
              className="bg-background flex size-11 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <FileUpIcon className="size-4 opacity-60" />
            </div>
            <div
              className="bg-background flex size-11 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <FolderIcon className="size-4 opacity-60" />
            </div>
          </div>
          <p className="mb-1.5 text-sm font-medium">Upload Markdown files or folders</p>
          <p className="text-muted-foreground mb-2 text-xs">
            Drag & drop or click to browse
          </p>
          <div className="text-muted-foreground/70 flex flex-wrap justify-center gap-1 text-xs">
            <span>Markdown files only (.md)</span>
            <span>∙</span>
            <span>Max {maxFiles} files</span>
            <span>∙</span>
            <span>Up to {formatBytes(maxSize)}</span>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div
          className="text-destructive flex items-center gap-1 text-xs"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className={`space-y-2 ${files.length > 3 ? 'max-h-64 overflow-y-auto' : ''}`}>
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-background flex items-center justify-between gap-2 rounded-lg border p-2 pe-3"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
                    {getFileIcon(file)}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="truncate text-[13px] font-medium">
                      {file.path
                        ? file.path.split('/').pop() // Show just the filename
                        : file.file instanceof File
                        ? file.file.name
                        : file.file.name}
                    </p>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <span>
                        {formatBytes(
                          file.file instanceof File
                            ? file.file.size
                            : file.file.size
                        )}
                      </span>
                      {file.path && (
                        <>
                          <span>•</span>
                          <span className="truncate">{file.path.split('/').slice(0, -1).join('/')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent"
                  onClick={() => removeFile(file.id)}
                  aria-label="Remove file"
                >
                  <XIcon className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>

          {/* Action buttons - always visible at bottom */}
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              size="sm" 
              onClick={handleImport}
              disabled={isImporting}
            >
              <ImportIcon className="size-4 mr-2" />
              {isImporting ? "Importing..." : "Import Files"}
            </Button>
            {files.length > 1 && (
              <Button size="sm" variant="outline" onClick={clearFiles}>
                Remove all files
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
