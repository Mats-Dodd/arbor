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

export default function Component({ nodes = [], collectionName = 'Collection' }: FileTreeProps) {
  const router = useRouter()
  const pathname = usePathname()
  const initialItems = nodes.length > 0 ? nodesToTreeItems(nodes, collectionName) : {
    root: {
      name: collectionName,
      children: []
    }
  }
  
  const [items, setItems] = useState(initialItems)

  const tree = useTree<Item>({
    initialState: {
      expandedItems: ["root", "app", "components"],
      selectedItems: pathname.startsWith('/node/') ? [pathname.split('/node/')[1]] : [],
    },
    indent,
    rootItemId: "root",
    getItemName: (item) => item.getItemData()?.name ?? "Unknown",
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    canReorder: false,
    onDrop: createOnDropHandler((parentItem, newChildrenIds) => {
      setItems((prevItems: Record<string, Item>) => {
        // Sort the children alphabetically
        const sortedChildren = [...newChildrenIds].sort((a, b) => {
          const itemA = prevItems[a]
          const itemB = prevItems[b]

          // First sort folders before files
          const isAFolder = (itemA?.children?.length ?? 0) > 0
          const isBFolder = (itemB?.children?.length ?? 0) > 0

          if (isAFolder && !isBFolder) return -1
          if (!isAFolder && isBFolder) return 1

          // Then sort alphabetically by name
          return (itemA?.name ?? "").localeCompare(itemB?.name ?? "")
        })

        return {
          ...prevItems,
          [parentItem.getId()]: {
            ...prevItems[parentItem.getId()],
            children: sortedChildren,
          },
        }
      })
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
    <div className="flex flex-col">
      <Tree
        className="relative overflow-y-auto max-h-[calc(100vh-300px)]"
        indent={indent}
        tree={tree}
      >
        <AssistiveTreeDescription tree={tree} />
        {tree.getItems().map((item) => {
          // Skip rendering the root item
          if (item.getId() === "root") {
            return null;
          }
          
          // Get the current node ID from the pathname
          const currentNodeId = pathname.startsWith('/node/') ? pathname.split('/node/')[1] : null
          const isActive = item.getId() === currentNodeId
          
          return (
            <TreeItem key={item.getId()} item={item} className="pb-0">
              <TreeItemLabel 
                className={`rounded-md py-1.5 px-2 text-sm hover:bg-accent/50 ${
                  !item.isFolder() ? 'cursor-pointer' : ''
                } ${isActive ? 'bg-accent' : ''}`}
                onClick={() => {
                  // Only navigate if it's a file (not a folder)
                  if (!item.isFolder()) {
                    router.push(`/node/${item.getId()}`)
                  }
                }}
              >
                <span className="flex items-center gap-2">
                  {item.isFolder() ? (
                    item.isExpanded() ? (
                      <RiFolderOpenLine className="text-muted-foreground pointer-events-none size-4" />
                    ) : (
                      <RiFolderLine className="text-muted-foreground pointer-events-none size-4" />
                    )
                  ) : (
                    getFileIcon(
                      item.getItemData()?.fileExtension,
                      "text-muted-foreground pointer-events-none size-4"
                    )
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
