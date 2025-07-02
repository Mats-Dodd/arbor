import { LoroDoc } from 'loro-crdt'
import { markdownToJSON } from '../utils/markdown-converter'
import { exportSnapshot } from '../utils/snapshot'

interface FileNode {
  name: string
  path: string
  kind: 'folder' | 'file'
  content?: string
  children: FileNode[]
}

interface FileWithPath extends File {
  webkitRelativePath: string
}

interface ImportResult {
  collectionId: string
  nodeCount: number
  fileCount: number
}

export class CollectionApiService {
  static async importCollection(
    files: FileWithPath[],
    collectionName: string,
    onProgress?: (progress: number) => void
  ): Promise<ImportResult> {
    try {
      // Build file tree structure from files
      const fileTree = await this.buildFileTree(files)
      
      // Process markdown files to Loro snapshots
      const processedFiles = await this.processMarkdownFiles(fileTree, onProgress)
      
      // Create FormData for upload
      const formData = new FormData()
      formData.append('collectionName', collectionName)
      formData.append('fileTree', JSON.stringify(processedFiles))
      
      // Upload to API
      const response = await fetch('/api/collections/import', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to import collection')
      }
      
      return await response.json()
    } catch (error) {
      console.error('[COLLECTION_API] Import failed:', error)
      throw error
    }
  }

  private static async buildFileTree(files: FileWithPath[]): Promise<FileNode> {
    const root: FileNode = {
      name: 'root',
      path: '',
      kind: 'folder',
      children: []
    }
    
    // Sort files by path to ensure correct hierarchy
    const sortedFiles = [...files].sort((a, b) => 
      a.webkitRelativePath.localeCompare(b.webkitRelativePath)
    )
    
    for (const file of sortedFiles) {
      const path = file.webkitRelativePath
      const parts = path.split('/')
      
      let current = root
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const isFile = i === parts.length - 1
        
        if (isFile) {
          // Add file node
          const content = await file.text()
          current.children.push({
            name: part,
            path: path,
            kind: 'file',
            content: content,
            children: []
          })
        } else {
          // Find or create folder
          let folder = current.children.find(
            child => child.name === part && child.kind === 'folder'
          )
          if (!folder) {
            folder = {
              name: part,
              path: parts.slice(0, i + 1).join('/'),
              kind: 'folder',
              children: []
            }
            current.children.push(folder)
          }
          current = folder
        }
      }
    }
    
    return root
  }

  private static async processMarkdownFiles(
    node: FileNode,
    onProgress?: (progress: number) => void,
    totalFiles?: number,
    processedFiles = { count: 0 }
  ): Promise<FileNode> {
    // Count total files if not provided
    if (totalFiles === undefined) {
      totalFiles = this.countFiles(node)
    }
    
    if (node.kind === 'file' && node.content) {
      // Process markdown to Loro snapshot
      const loroSnapshot = await this.processMarkdownToLoro(node.content)
      
      // Update progress
      processedFiles.count++
      if (onProgress && totalFiles > 0) {
        onProgress((processedFiles.count / totalFiles) * 100)
      }
      
      return {
        ...node,
        content: loroSnapshot // Replace content with Loro snapshot
      }
    }
    
    // Process children recursively
    const processedChildren = await Promise.all(
      node.children.map(child => 
        this.processMarkdownFiles(child, onProgress, totalFiles, processedFiles)
      )
    )
    
    return {
      ...node,
      children: processedChildren
    }
  }

  private static countFiles(node: FileNode): number {
    if (node.kind === 'file') return 1
    return node.children.reduce((sum, child) => sum + this.countFiles(child), 0)
  }

  private static async processMarkdownToLoro(markdownContent: string): Promise<string> {
    try {
      const prosemirrorJson = markdownToJSON(markdownContent)
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
      if (!snapshot) {
        throw new Error('Failed to create snapshot')
      }
      return snapshot
    } catch (error) {
      console.error('[COLLECTION_API] Failed to process markdown:', error)
      // Return empty snapshot on error
      const emptyDoc = new LoroDoc()
      const emptySnapshot = exportSnapshot(emptyDoc)
      return emptySnapshot || ''
    }
  }
} 