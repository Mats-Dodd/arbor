"use client"

import React, { useState } from "react"
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
  RiFileLine,
  RiFileTextLine,
} from "@remixicon/react"

import { Tree, TreeItem, TreeItemLabel } from "@repo/design-system/components/tree"

interface Item {
  name: string
  children?: string[]
  isNote?: boolean
}

const initialItems: Record<string, Item> = {
  root: {
    name: "All Notes",
    children: [
      "personal",
      "work",
      "quick-notes",
      "daily-note-2024-01-15",
      "meeting-notes-q1",
      "project-ideas"
    ],
  },
  personal: {
    name: "Personal",
    children: ["recipes", "travel-plans", "books-to-read"],
  },
  recipes: { name: "Favorite Recipes", isNote: true },
  "travel-plans": { name: "Travel Plans 2024", isNote: true },
  "books-to-read": { name: "Reading List", isNote: true },
  work: {
    name: "Work",
    children: ["projects", "meetings", "team-notes"],
  },
  projects: {
    name: "Projects",
    children: ["project-alpha", "project-beta"],
  },
  "project-alpha": { name: "Project Alpha", isNote: true },
  "project-beta": { name: "Project Beta", isNote: true },
  meetings: { name: "Meeting Notes", isNote: true },
  "team-notes": { name: "Team Updates", isNote: true },
  "quick-notes": { name: "Quick Notes", isNote: true },
  "daily-note-2024-01-15": { name: "Daily Note - Jan 15", isNote: true },
  "meeting-notes-q1": { name: "Q1 Planning Meeting", isNote: true },
  "project-ideas": { name: "Project Ideas", isNote: true },
}

// Helper function to get icon based on file extension
function getItemIcon(item: Item | undefined, className: string) {
  if (!item) return null;
  
  // For folders
  if (item.children && item.children.length > 0) {
    return null; // Let the tree component handle folder icons
  }
  
  // For notes
  if (item.isNote) {
    return <RiFileTextLine className={className} />
  }
  
  return <RiFileLine className={className} />
}

const indent = 20

export default function Component() {
  const [items, setItems] = useState(initialItems)

  const tree = useTree<Item>({
    initialState: {
      expandedItems: ["root", "personal", "work", "projects"],
      selectedItems: [],
    },
    indent,
    rootItemId: "root",
    getItemName: (item) => item.getItemData()?.name ?? "Unknown",
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    canReorder: false,
    onDrop: createOnDropHandler((parentItem, newChildrenIds) => {
      setItems((prevItems) => {
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
    <div className="h-full p-2">
      <Tree
        className="relative select-none"
        indent={indent}
        tree={tree}
      >
        <AssistiveTreeDescription tree={tree} />
        {tree.getItems().map((item) => {
          // Skip rendering the root item itself
          if (item.getId() === 'root') {
            return null;
          }
          
          return (
            <TreeItem key={item.getId()} item={item} className="py-0">
              <TreeItemLabel className="hover:bg-accent/50 rounded-md px-2 py-1.5 text-sm">
                <span className="flex items-center gap-2">
                  {!item.isFolder() &&
                    getItemIcon(
                      item.getItemData(),
                      "text-muted-foreground size-3.5"
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
