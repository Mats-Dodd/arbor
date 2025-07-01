import type { NodeData } from '../types'

export class NodeApiService {
  static async loadNode(nodeId: string): Promise<NodeData | null> {
    try {
      const response = await fetch(`/api/nodes/${nodeId}`)
      
      if (response.ok) {
        return await response.json()
      }
      
      if (response.status === 404) {
        return null
      }
      
      throw new Error(`Failed to load node: ${response.statusText}`)
    } catch (error) {
      console.error('[NODE_API] Failed to load node:', error)
      throw error
    }
  }

  static async saveSnapshot(nodeId: string, snapshot: string): Promise<void> {
    try {
      const response = await fetch(`/api/nodes/${nodeId}/snapshot`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to save snapshot: ${response.statusText}`)
      }
      
      console.log('[NODE_API] Snapshot saved successfully')
    } catch (error) {
      console.error('[NODE_API] Failed to save snapshot:', error)
      throw error
    }
  }

  static async createNode(nodeId: string, data: Partial<NodeData>): Promise<NodeData> {
    try {
      const response = await fetch(`/api/nodes/${nodeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create node: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('[NODE_API] Failed to create node:', error)
      throw error
    }
  }

  static async updateNodeTitle(nodeId: string, title: string): Promise<void> {
    try {
      const response = await fetch(`/api/nodes/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: title })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update title: ${response.statusText}`)
      }
    } catch (error) {
      console.error('[NODE_API] Failed to update title:', error)
      throw error
    }
  }
} 