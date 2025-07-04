import { useState, useEffect, useCallback } from 'react'
import { EDITOR_CONFIG } from '../config/editor-config'

interface UseDocumentTitleProps {
  initialTitle?: string
  nodeId: string
}

interface UseDocumentTitleReturn {
  title: string
  setTitle: (title: string) => void
  isUnsaved: boolean
}

export const useDocumentTitle = ({ 
  initialTitle = '', 
  nodeId 
}: UseDocumentTitleProps): UseDocumentTitleReturn => {
  const [title, setTitle] = useState(initialTitle)
  const [isUnsaved, setIsUnsaved] = useState(false)

  useEffect(() => {
    const savedTitle = localStorage.getItem(EDITOR_CONFIG.STORAGE_KEYS.EDITOR_TITLE)
    if (savedTitle && !initialTitle) {
      setTitle(savedTitle)
    } 
  }, [initialTitle])

  useEffect(() => {
    if (initialTitle) {
      setTitle(initialTitle)
    }
  }, [initialTitle])

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(EDITOR_CONFIG.STORAGE_KEYS.EDITOR_TITLE, title)
      setIsUnsaved(false)
    }, EDITOR_CONFIG.TITLE_SAVE_DELAY)

    setIsUnsaved(true)

    return () => clearTimeout(timer)
  }, [title])

  const handleSetTitle = useCallback((newTitle: string) => {
    setTitle(newTitle)
  }, [])

  return {
    title,
    setTitle: handleSetTitle,
    isUnsaved
  }
} 