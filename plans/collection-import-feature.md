# Collection Import Feature Plan

## Overview
Implement a feature to import collections of markdown files and folders from the user's computer, creating a collection structure that matches the Prisma schema.

## Core Requirements
- Upload markdown files and folders from computer
- Create a Collection with hierarchical Node structure
- Convert markdown content to Loro snapshots
- Maintain folder/file relationships

## Database Schema Reference
```prisma
model Collection {
  id        String   @id @default(uuid())
  name      String
  metadata  Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  nodes     Node[]
}

model Node {
  id           String     @id @default(uuid())
  name         String
  kind         NodeKind   // folder | file
  loroSnapshot Bytes      // For file content
  parentId     String?
  parent       Node?      @relation("NodeToSubNode")
  children     Node[]     @relation("NodeToSubNode")
  metadata     Json
  collectionId String
  collection   Collection
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}
```

## Implementation Plan

### 1. Component Structure

#### A. CollectionImportDialog Component
Location: `apps/app/app/(authenticated)/components/collection-import-dialog.tsx`

Features:
- Uses the provided file upload component
- Accepts only `.md` files and folders
- Shows upload progress
- Allows naming the collection
- Processes files on submit

#### B. Update Sidebar Import Button
Location: `apps/app/app/(authenticated)/components/app-sidebar.tsx`

Changes:
- Add state for dialog visibility
- Wire Import button to open CollectionImportDialog

### 2. API Structure

#### Collection Import Endpoint
Location: `apps/app/app/api/collections/import/route.ts`

Responsibilities:
- Accept FormData with files
- Create collection record
- Process files recursively
- Return collection ID and import summary

### 3. Processing Logic

#### File Processing Flow:
1. **Parse uploaded files**
   - Build folder structure from file paths
   - Extract folder names and hierarchy

2. **Create Collection**
   ```typescript
   const collection = await database.collection.create({
     data: {
       name: collectionName,
       metadata: {
         importedAt: new Date(),
         fileCount: markdownFiles.length
       }
     }
   })
   ```

3. **Process Nodes Recursively**
   ```typescript
   // For each folder
   const folderNode = await database.node.create({
     data: {
       name: folderName,
       kind: 'folder',
       collectionId: collection.id,
       parentId: parentNode?.id,
       metadata: {}
     }
   })

   // For each markdown file
   const loroSnapshot = await processMarkdownToLoro(markdownContent)
   const fileNode = await database.node.create({
     data: {
       name: fileName,
       kind: 'file',
       loroSnapshot: Buffer.from(loroSnapshot, 'base64'),
       collectionId: collection.id,
       parentId: parentNode?.id,
       metadata: {}
     }
   })
   ```

### 4. Service Layer

#### CollectionApiService
Location: `apps/app/app/(authenticated)/components/editor/services/collection-api.ts`

Methods:
- `importCollection(files: File[], collectionName: string)`
- `processMarkdownToLoro(content: string): Promise<string>`

### 5. Markdown to Loro Processing

Reuse existing pattern from `MarkdownImportDialog.tsx`:
```typescript
async function processMarkdownToLoro(markdownContent: string): Promise<string> {
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
  
  return exportSnapshot(loroDoc)
}
```

### 6. File Upload Configuration

**Note:** The provided component uses a `useFileUpload` hook that needs to be implemented. Two options:

**Option A: Implement the useFileUpload hook**
Location: `apps/app/hooks/use-file-upload.ts`


### 7. Implementation Steps

1. **Step 1**: Create `collection-import-dialog.tsx` with file upload UI
2. **Step 2**: Wire up sidebar import button to open dialog
3. **Step 3**: Create `collection-api.ts` service
4. **Step 4**: Create `/api/collections/import` endpoint
5. **Step 5**: Implement file structure parsing logic
6. **Step 6**: Add batch processing for Loro conversions
7. **Step 7**: Update file tree to show imported collections

### 8. File Structure Parsing

Example: Converting file paths to node hierarchy
```typescript
// Input: Array of File objects with paths like:
// - "docs/README.md"
// - "docs/guides/getting-started.md"
// - "examples/basic.md"

// Output: Node tree structure
interface FileNode {
  name: string
  path: string
  kind: 'folder' | 'file'
  content?: string
  children: FileNode[]
}

function buildFileTree(files: File[]): FileNode {
  const root: FileNode = {
    name: 'root',
    path: '',
    kind: 'folder',
    children: []
  }
  
  // Files from webkitdirectory have webkitRelativePath property
  for (const file of files) {
    const path = (file as any).webkitRelativePath || file.name
    const parts = path.split('/')
    
    let current = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      
      if (isFile) {
        // Add file node
        current.children.push({
          name: part,
          path: path,
          kind: 'file',
          content: await file.text(), // Read file content
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
```

### 9. Error Handling

- Validate file types (only .md allowed)
- Handle large collections with progress updates
- Transaction rollback on failure
- Clear error messages for users

### 10. UI/UX Considerations

- Show import progress with file count
- Display folder structure preview before import
- Allow collection name customization
- Success message with link to view collection

## Next Steps After Implementation

1. Add support for more file types (if needed)
2. Implement collection export feature
3. Add collection management UI
4. Support for updating existing collections

## Keeping It Simple

Focus on MVP features:
- Basic file/folder upload
- Markdown to Loro conversion
- Collection creation with proper hierarchy
- Simple progress indication

Avoid complexity:
- No file preview/editing during import
- No duplicate detection initially
- No merge with existing collections
- Basic metadata only

## Quick Implementation Summary

1. **User clicks Import button** → Opens CollectionImportDialog
2. **User selects folder with .md files** → Files are loaded into memory
3. **User names the collection** → Clicks "Import"
4. **System processes files**:
   - Creates Collection record
   - Builds folder structure from file paths
   - Creates folder nodes (no Loro snapshot)
   - Converts each .md file to Loro snapshot
   - Creates file nodes with snapshots
   - Maintains parent-child relationships
5. **Success** → Redirects to collection view

The key insight is reusing your existing markdown-to-Loro conversion logic from `MarkdownImportDialog.tsx` for each file, while adding the folder hierarchy structure on top. 