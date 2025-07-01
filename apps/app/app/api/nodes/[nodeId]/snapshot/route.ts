import { NextRequest, NextResponse } from 'next/server'
import { database } from '@repo/database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params
    const { snapshot } = await request.json()
    
    const snapshotBuffer = Buffer.from(snapshot, 'base64')
    
    const node = await database.node.update({
      where: { id: nodeId },
      data: {
        loroSnapshot: snapshotBuffer,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({ success: true, nodeId: node.id })
  } catch (error) {
    console.error('Failed to save snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to save snapshot' },
      { status: 500 }
    )
  }
} 