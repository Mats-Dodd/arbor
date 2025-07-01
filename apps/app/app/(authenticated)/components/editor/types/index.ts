export interface NodeData {
  id: string
  name: string
  loroSnapshot?: string
  createdAt?: string
  updatedAt?: string
}

export interface EditorState {
  isLoading: boolean
  isSaving: boolean
  error?: string
}

export interface DocumentPersistenceState {
  isSaving: boolean
  lastSaved?: Date
  error?: string
} 