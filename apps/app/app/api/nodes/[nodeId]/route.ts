import { NextRequest, NextResponse } from 'next/server'
import { database } from '@repo/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params
    const node = await database.node.findUnique({
      where: { id: nodeId },
      select: {
        id: true,
        name: true,
        loroSnapshot: true,
        metadata: true,
        collectionId: true
      }
    })
    
    if (!node) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      )
    }
    
    const response = {
      ...node,
      loroSnapshot: node.loroSnapshot ? Buffer.from(node.loroSnapshot).toString('base64') : null,
      collectionId: node.collectionId
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch node:', error)
    return NextResponse.json(
      { error: 'Failed to fetch node' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params
    const body = await request.json()
    
    let collection
    
    // If collectionId is provided, use existing collection
    if (body.collectionId) {
      collection = await database.collection.findUnique({
        where: { id: body.collectionId }
      })
    }
    
    // If collectionName is provided, create new collection
    if (!collection && body.collectionName) {
      collection = await database.collection.create({
        data: {
          name: body.collectionName,
          metadata: body.collectionMetadata || {}
        }
      })
    }
    
    // Fallback to default collection
    if (!collection) {
      collection = await database.collection.findFirst({
        where: { name: 'Default Collection' }
      })
      
      if (!collection) {
        collection = await database.collection.create({
          data: {
            name: 'Default Collection',
            metadata: {}
          }
        })
      }
    }
    

    const nodeData = {
      id: nodeId,
      name: body.name || 'Untitled',
      kind: body.kind || 'file' as const,
      loroSnapshot: body.loroSnapshot ? Buffer.from(body.loroSnapshot, 'base64') : Buffer.from(''),
      metadata: body.metadata || {},
      collectionId: collection.id,
      parentId: body.parentId || undefined
    }
    
    const node = await database.node.create({
      data: nodeData
    })
    
    const response = {
      ...node,
      loroSnapshot: node.loroSnapshot ? Buffer.from(node.loroSnapshot).toString('base64') : null
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to create node:', error)
    return NextResponse.json(
      { error: 'Failed to create node' },
      { status: 500 }
    )
  }
} 