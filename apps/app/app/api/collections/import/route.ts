import { NextRequest, NextResponse } from 'next/server'
import { database } from '@repo/database'

interface FileNode {
  name: string
  path: string
  kind: 'folder' | 'file'
  content?: string
  children: FileNode[]
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const collectionName = formData.get('collectionName') as string
    const fileTreeJson = formData.get('fileTree') as string
    
    if (!collectionName || !fileTreeJson) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const fileTree = JSON.parse(fileTreeJson) as FileNode
    
    // Create the collection
    const collection = await database.collection.create({
      data: {
        name: collectionName,
        metadata: {
          importedAt: new Date(),
          fileCount: countFiles(fileTree)
        }
      }
    })
    
    // Process the file tree and create nodes
    const nodeCount = await processNodeTree(fileTree, collection.id, null)
    
    return NextResponse.json({
      collectionId: collection.id,
      nodeCount,
      fileCount: countFiles(fileTree)
    })
  } catch (error) {
    console.error('Collection import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import collection' },
      { status: 500 }
    )
  }
}

async function processNodeTree(
  node: FileNode,
  collectionId: string,
  parentId: string | null
): Promise<number> {
  let nodeCount = 0
  
  // Skip the root node, process its children directly
  if (node.name === 'root') {
    for (const child of node.children) {
      nodeCount += await processNodeTree(child, collectionId, parentId)
    }
    return nodeCount
  }
  
  if (node.kind === 'folder') {
    // Create folder node
    const folderNode = await database.node.create({
      data: {
        name: node.name,
        kind: 'folder',
        loroSnapshot: Buffer.from(''), // Empty buffer for folders
        collectionId,
        parentId,
        metadata: {
          path: node.path
        }
      }
    })
    
    nodeCount++
    
    // Process children
    for (const child of node.children) {
      nodeCount += await processNodeTree(child, collectionId, folderNode.id)
    }
  } else if (node.kind === 'file' && node.content) {
    // Create file node with Loro snapshot
    await database.node.create({
      data: {
        name: node.name,
        kind: 'file',
        loroSnapshot: Buffer.from(node.content, 'base64'),
        collectionId,
        parentId,
        metadata: {
          path: node.path,
          originalExtension: getFileExtension(node.name)
        }
      }
    })
    
    nodeCount++
  }
  
  return nodeCount
}

function countFiles(node: FileNode): number {
  if (node.kind === 'file') return 1
  return node.children.reduce((sum, child) => sum + countFiles(child), 0)
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1] : ''
} 