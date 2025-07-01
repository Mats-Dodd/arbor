import { useState, useEffect } from 'react'
import type { LoroDoc } from 'loro-crdt'
import { createLoroDoc } from '../loro'
import { NodeApiService } from '../services/node-api'
import { importSnapshot } from '../utils/snapshot'

interface UseLoroDocumentReturn {
  loroDoc: LoroDoc | null
  isLoading: boolean
  error: string | null
  nodeTitle: string
}

export const useLoroDocument = (nodeId: string): UseLoroDocumentReturn => {
  const [loroDoc, setLoroDoc] = useState<LoroDoc | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nodeTitle, setNodeTitle] = useState('')

  useEffect(() => {
    let mounted = true
    let doc: LoroDoc | null = null

    const loadDocument = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        doc = createLoroDoc()
        
        const nodeData = await NodeApiService.loadNode(nodeId)
        
        if (nodeData) {
          if (nodeData.loroSnapshot) {
            const imported = importSnapshot(doc, nodeData.loroSnapshot)
            if (!imported) {
              throw new Error('Failed to import snapshot')
            }
          }
          
          if (nodeData.name && mounted) {
            setNodeTitle(nodeData.name)
          }
        } else {
          console.log('[useLoroDocument] Node not found:', nodeId)
        }
        
        if (mounted) {
          setLoroDoc(doc)
        }
      } catch (err) {
        console.error('[useLoroDocument] Failed to load document:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load document')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadDocument()

    return () => {
      mounted = false
      if (doc) {
        setLoroDoc(null)
      }
    }
  }, [nodeId])

  return { loroDoc, isLoading, error, nodeTitle }
} 