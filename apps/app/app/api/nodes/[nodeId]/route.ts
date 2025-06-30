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
    
    // Convert Buffer to base64 for transmission
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