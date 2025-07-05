import { NextRequest, NextResponse } from 'next/server';
import { database } from '@repo/database';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { nodeId: string } }
) {
  try {
    const { parentId } = await request.json();
    const { nodeId } = params;

    // Basic validation - don't move a node into itself
    if (nodeId === parentId) {
      return NextResponse.json(
        { error: 'Cannot move a node into itself' },
        { status: 400 }
      );
    }

    // If parentId is provided, verify it's a folder
    if (parentId) {
      const parentNode = await database.node.findUnique({
        where: { id: parentId },
        select: { kind: true }
      });

      if (!parentNode) {
        return NextResponse.json(
          { error: 'Parent node not found' },
          { status: 404 }
        );
      }

      if (parentNode.kind !== 'folder') {
        return NextResponse.json(
          { error: 'Cannot move nodes into files' },
          { status: 400 }
        );
      }
    }

    // Update the node's parentId
    const updatedNode = await database.node.update({
      where: { id: nodeId },
      data: { parentId: parentId || null },
      include: {
        parent: true,
        collection: true
      }
    });

    return NextResponse.json(updatedNode);
  } catch (error) {
    console.error('Error moving node:', error);
    return NextResponse.json(
      { error: 'Failed to move node' },
      { status: 500 }
    );
  }
} 