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
        metadata: true
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
      loroSnapshot: node.loroSnapshot ? Buffer.from(node.loroSnapshot).toString('base64') : null
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
    
    let collection = await database.collection.findFirst({
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
    

    const nodeData = {
      id: nodeId,
      name: body.name || 'Untitled',
      kind: 'file' as const,
      loroSnapshot: body.loroSnapshot ? Buffer.from(body.loroSnapshot, 'base64') : Buffer.from(''),
      metadata: body.metadata || {},
      collectionId: collection.id
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