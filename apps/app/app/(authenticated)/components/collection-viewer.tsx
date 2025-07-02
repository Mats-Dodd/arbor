'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  RiFolderLine,
  RiFolderOpenLine,
  RiFileTextLine,
} from "@remixicon/react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { Button } from "@repo/design-system/components/ui/button"
import type { Collection, Node } from "@repo/database/generated/client"

interface CollectionWithNodes extends Collection {
  nodes: Node[]
}

interface CollectionViewerProps {
  collection: CollectionWithNodes
}

interface TreeNode extends Node {
  childNodes?: TreeNode[]
}

export default function CollectionViewer({ collection }: CollectionViewerProps) {
  const router = useRouter()
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  
  // Build tree structure from flat nodes array
  const buildNodeTree = (nodes: Node[]): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>()
    const rootNodes: TreeNode[] = []
    
    // First pass: create all nodes
    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, childNodes: [] })
    })
    
    // Second pass: build hierarchy
    nodes.forEach(node => {
      const treeNode = nodeMap.get(node.id)!
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId)
        if (parent) {
          parent.childNodes = parent.childNodes || []
          parent.childNodes.push(treeNode)
        }
      } else {
        rootNodes.push(treeNode)
      }
    })
    
    // Sort nodes: folders first, then alphabetically
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.sort((a, b) => {
        if (a.kind !== b.kind) {
          return a.kind === 'folder' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
    }
    
    // Recursively sort all levels
    const sortTree = (nodes: TreeNode[]): TreeNode[] => {
      return sortNodes(nodes).map(node => ({
        ...node,
        childNodes: node.childNodes ? sortTree(node.childNodes) : []
      }))
    }
    
    return sortTree(rootNodes)
  }
  
  const nodeTree = buildNodeTree(collection.nodes)
  
  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }
  
  const handleNodeClick = (node: TreeNode) => {
    if (node.kind === 'folder') {
      toggleExpanded(node.id)
    } else {
      // Navigate to the node editor
      router.push(`/node/${node.id}`)
    }
  }
  
  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.childNodes && node.childNodes.length > 0
    
    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-1 py-1.5 px-2 hover:bg-accent/50 rounded-md cursor-pointer group"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleNodeClick(node)}
        >
          {node.kind === 'folder' && hasChildren && (
            <div className="w-4 h-4 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          )}
          {node.kind === 'folder' && !hasChildren && (
            <div className="w-4 h-4" />
          )}
          
          <div className="flex items-center gap-2 flex-1">
            {node.kind === 'folder' ? (
              isExpanded ? (
                <RiFolderOpenLine className="h-4 w-4 text-muted-foreground" />
              ) : (
                <RiFolderLine className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <RiFileTextLine className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">{node.name}</span>
          </div>
          
          {node.kind === 'file' && (
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/node/${node.id}`)
              }}
            >
              Open
            </Button>
          )}
        </div>
        
        {node.kind === 'folder' && isExpanded && node.childNodes && (
          <div>
            {node.childNodes.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="bg-background border rounded-lg p-4">
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {collection.nodes.filter(n => n.kind === 'file').length} files in{' '}
          {collection.nodes.filter(n => n.kind === 'folder').length} folders
        </p>
      </div>
      
      <div className="space-y-0.5">
        {nodeTree.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No files in this collection
          </p>
        ) : (
          nodeTree.map(node => renderNode(node))
        )}
      </div>
    </div>
  )
} 