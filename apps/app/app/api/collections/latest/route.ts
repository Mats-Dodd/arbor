import { NextRequest, NextResponse } from 'next/server'
import { database } from '@repo/database'

export async function GET(request: NextRequest) {
  try {
    // Find the collection with the most recent updatedAt
    const latestCollection = await database.collection.findFirst({
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        nodes: {
          select: {
            id: true,
            name: true,
            kind: true,
            parentId: true,
            metadata: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    if (!latestCollection) {
      return NextResponse.json(null)
    }

    return NextResponse.json(latestCollection)
  } catch (error) {
    console.error('Failed to fetch latest collection:', error)
    return NextResponse.json(
      { error: 'Failed to fetch latest collection' },
      { status: 500 }
    )
  }
} 