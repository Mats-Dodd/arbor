import { useCallback, useRef, useState, useEffect } from 'react'
import type { LoroDoc } from 'loro-crdt'
import { NodeApiService } from '../services/node-api'
import { exportSnapshot } from '../utils/snapshot'
import { EDITOR_CONFIG } from '../config/editor-config'
import type { DocumentPersistenceState } from '../types'

interface UseDocumentPersistenceProps {
  loroDoc: LoroDoc | null
  nodeId: string
}

interface UseDocumentPersistenceReturn extends DocumentPersistenceState {
  saveSnapshot: () => Promise<void>
  debouncedSave: () => void
}

export const useDocumentPersistence = ({ 
  loroDoc, 
  nodeId 
}: UseDocumentPersistenceProps): UseDocumentPersistenceReturn => {
  const [state, setState] = useState<DocumentPersistenceState>({
    isSaving: false,
    lastSaved: undefined,
    error: undefined
  })
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const saveSnapshot = useCallback(async () => {
    if (!loroDoc) return
    
    try {
      setState(prev => ({ ...prev, isSaving: true, error: undefined }))
      
      const snapshot = exportSnapshot(loroDoc)
      if (!snapshot) {
        throw new Error('Failed to export snapshot')
      }
      
      await NodeApiService.saveSnapshot(nodeId, snapshot)
      
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        lastSaved: new Date() 
      }))
    } catch (error) {
      console.error('[useDocumentPersistence] Save failed:', error)
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        error: error instanceof Error ? error.message : 'Failed to save'
      }))
    }
  }, [loroDoc, nodeId])

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveSnapshot()
    }, EDITOR_CONFIG.AUTOSAVE_DELAY)
  }, [saveSnapshot])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...state,
    saveSnapshot,
    debouncedSave
  }
} 