"use client"

import React, { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  createOnDropHandler,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from "@headless-tree/core"
import { AssistiveTreeDescription, useTree } from "@headless-tree/react"
import {
  RiBracesLine,
  RiCodeSSlashLine,
  RiFileLine,
  RiFileTextLine,
  RiImageLine,
  RiReactjsLine,
  RiFolderLine,
  RiFolderOpenLine,
} from "@remixicon/react"

import { Tree, TreeItem, TreeItemLabel } from "./tree"

interface Item {
  name: string
  children?: string[]
  fileExtension?: string
}

interface Node {
  id: string
  name: string
  kind: 'folder' | 'file'
  parentId: string | null
  metadata?: any
}

interface FileTreeProps {
  nodes?: Node[]
  collectionName?: string
  onNodeMoved?: () => void
}

// Helper function to convert nodes to tree structure
function nodesToTreeItems(nodes: Node[], collectionName: string): Record<string, Item> {
  const items: Record<string, Item> = {}
  
  // Create root item
  items.root = {
    name: collectionName || 'Collection',
    children: []
  }
  
  // First pass: create all items
  nodes.forEach(node => {
    const fileExtension = node.kind === 'file' ? node.name.split('.').pop() : undefined
    items[node.id] = {
      name: node.name,
      children: node.kind === 'folder' ? [] : undefined,
      fileExtension
    }
  })
  
  // Second pass: build hierarchy
  nodes.forEach(node => {
    if (node.parentId && items[node.parentId]) {
      // Add to parent's children
      if (!items[node.parentId].children) {
        items[node.parentId].children = []
      }
      items[node.parentId].children!.push(node.id)
    } else if (!node.parentId) {
      // Add to root if no parent
      items.root.children!.push(node.id)
    }
  })
  
  // Sort children for each folder
  Object.values(items).forEach(item => {
    if (item.children) {
      item.children.sort((a, b) => {
        const itemA = items[a]
        const itemB = items[b]
        
        // Folders first, then files
        const isAFolder = (itemA?.children?.length ?? 0) > 0
        const isBFolder = (itemB?.children?.length ?? 0) > 0
        
        if (isAFolder && !isBFolder) return -1
        if (!isAFolder && isBFolder) return 1
        
        // Then alphabetically
        return (itemA?.name ?? '').localeCompare(itemB?.name ?? '')
      })
    }
  })
  
  return items
}

// Helper function to get icon based on file extension
function getFileIcon(extension: string | undefined, className: string) {
  switch (extension) {
    case "tsx":
    case "jsx":
      return <RiReactjsLine className={className} />
    case "ts":
    case "js":
    case "mjs":
      return <RiCodeSSlashLine className={className} />
    case "json":
      return <RiBracesLine className={className} />
    case "svg":
    case "ico":
    case "png":
    case "jpg":
      return <RiImageLine className={className} />
    case "md":
      return <RiFileTextLine className={className} />
    default:
      return <RiFileLine className={className} />
  }
}

const indent = 16

export default function Component({ nodes = [], collectionName = 'Collection', onNodeMoved }: FileTreeProps) {
  const router = useRouter()
  const pathname = usePathname()
  const initialItems = nodes.length > 0 ? nodesToTreeItems(nodes, collectionName) : {
    root: {
      name: collectionName,
      children: []
    }
  }
  
  const [items, setItems] = useState(initialItems)
  const [isMoving, setIsMoving] = useState(false)

  const tree = useTree<Item>({
    initialState: {
      expandedItems: ["root"],
      selectedItems: pathname.startsWith('/node/') ? [pathname.split('/node/')[1]] : [],
    },
    indent,
    rootItemId: "root",
    getItemName: (item) => item.getItemData()?.name ?? "Unknown",
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    canReorder: false,
    onDrop: createOnDropHandler(async (parentItem, newChildrenIds) => {
      // Get the parent ID (null if root)
      const newParentId = parentItem.getId() === 'root' ? null : parentItem.getId();
      
      // For simplicity, we'll handle one node at a time
      // In a real app, you might want to handle multiple selections
      const movedNodeId = newChildrenIds.find(id => {
        // Find which node was moved by checking if it's new to this parent
        const currentChildren = items[parentItem.getId()]?.children || [];
        return !currentChildren.includes(id);
      });
      
      if (!movedNodeId || movedNodeId === 'root') return;
      
      // Prevent moving into the same parent (no-op)
      const currentParent = Object.keys(items).find(key => 
        items[key].children?.includes(movedNodeId)
      );
      if (currentParent === parentItem.getId()) return;
      
      setIsMoving(true);
      
      try {
        // Call the API to move the node
        const response = await fetch(`/api/nodes/${movedNodeId}/move`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ parentId: newParentId }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to move node');
        }
        
        // Update local state on success
        setItems((prevItems: Record<string, Item>) => {
          // Remove the node from its old parent
          const updatedItems = { ...prevItems };
          Object.keys(updatedItems).forEach(key => {
            if (updatedItems[key].children?.includes(movedNodeId)) {
              updatedItems[key] = {
                ...updatedItems[key],
                children: updatedItems[key].children!.filter(id => id !== movedNodeId)
              };
            }
          });
          
          // Add to new parent with sorting
          const sortedChildren = [...newChildrenIds].sort((a, b) => {
            const itemA = updatedItems[a]
            const itemB = updatedItems[b]

            // First sort folders before files
            const isAFolder = (itemA?.children?.length ?? 0) > 0
            const isBFolder = (itemB?.children?.length ?? 0) > 0

            if (isAFolder && !isBFolder) return -1
            if (!isAFolder && isBFolder) return 1

            // Then sort alphabetically by name
            return (itemA?.name ?? "").localeCompare(itemB?.name ?? "")
          })

          return {
            ...updatedItems,
            [parentItem.getId()]: {
              ...updatedItems[parentItem.getId()],
              children: sortedChildren,
            },
          }
        })
        
        // Notify parent component to refresh the data
        if (onNodeMoved) {
          onNodeMoved();
        }
      } catch (error) {
        console.error('Error moving node:', error);
        // Optionally show an error toast or revert the change
      } finally {
        setIsMoving(false);
      }
    }),
    dataLoader: {
      getItem: (itemId) => items[itemId],
      getChildren: (itemId) => items[itemId]?.children ?? [],
    },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
    ],
  })

  return (
    <div className="flex flex-col relative">
      {isMoving && (
        <div className="absolute inset-0 bg-background/50 z-50 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Moving...</div>
        </div>
      )}
      <Tree
        className="relative overflow-y-auto max-h-[calc(100vh-300px)] overflow-x-auto"
        indent={indent}
        tree={tree}
      >
        <AssistiveTreeDescription tree={tree} />
        {tree.getItems().map((item) => {
          // Get the current node ID from the pathname
          const currentNodeId = pathname.startsWith('/node/') ? pathname.split('/node/')[1] : null
          const isActive = item.getId() === currentNodeId
          
          return (
            <TreeItem key={item.getId()} item={item} className="pb-0">
              <TreeItemLabel 
                className={`rounded-md py-1.5 px-2 text-sm ${
                  item.getId() === 'root' 
                    ? 'font-semibold text-muted-foreground hover:bg-accent/30' 
                    : `hover:bg-accent/50 ${!item.isFolder() ? 'cursor-pointer' : ''}`
                } ${isActive ? 'bg-accent' : ''}`}
                onClick={() => {
                  // Only navigate if it's a file (not a folder or root)
                  if (!item.isFolder() && item.getId() !== 'root') {
                    router.push(`/node/${item.getId()}`)
                  }
                }}
              >
                <span className="flex items-center gap-2 min-w-0">
                  {item.isFolder() ? (
                    <>
                      {item.getId() !== 'root' && (
                        item.isExpanded() ? (
                          <RiFolderOpenLine className="text-muted-foreground pointer-events-none size-4 flex-shrink-0" />
                        ) : (
                          <RiFolderLine className="text-muted-foreground pointer-events-none size-4 flex-shrink-0" />
                        )
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-4 flex-shrink-0" />
                      {getFileIcon(
                        item.getItemData()?.fileExtension,
                        "text-muted-foreground pointer-events-none size-4 flex-shrink-0"
                      )}
                    </>
                  )}
                  <span className="truncate">{item.getItemName()}</span>
                </span>
              </TreeItemLabel>
            </TreeItem>
          )
        })}
      </Tree>
    </div>
  )
}
