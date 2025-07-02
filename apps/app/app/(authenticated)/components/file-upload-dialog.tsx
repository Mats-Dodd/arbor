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

import {
  formatBytes,
  useFileUpload,
  type FileWithPreview,
} from "@/hooks/use-file-upload"
import { Button } from "@repo/design-system/components/ui/button"
import { mdToPM, markdownToJSON } from "./editor/utils/markdown-converter"
import { LoroDoc } from "loro-crdt"



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
      for (const fileWrapper of files) {
        if (fileWrapper.file instanceof File) {
          const fileName = fileWrapper.file.name.toLowerCase()
          
          // Double-check that it's a markdown file
          if (!fileName.endsWith('.md')) {
            console.warn(`Skipping non-markdown file: ${fileWrapper.file.name}`)
            continue
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

          const { Editor } = await import('@tiptap/core')
          const StarterKit = await import('@tiptap/starter-kit')
          const { createLoroExtension } = await import('./editor/loro')
      
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
            console.log('[FILE_UPLOAD_DIALOG] loro json', loroDoc.toJSON())
      
            tempEditor.destroy()
        }
      }
      
 
      
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
    } catch (error) {
      console.error("Error importing files:", error)
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

          {/* Action buttons */}
          {files.length > 0 && (
            <div className="flex gap-2">
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
          )}
        </div>
      )}
    </div>
  )
}
