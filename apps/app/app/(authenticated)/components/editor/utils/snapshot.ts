import type { LoroDoc } from 'loro-crdt'

export const encodeSnapshot = (snapshot: Uint8Array): string => {
  return btoa(String.fromCharCode(...snapshot))
}

export const decodeSnapshot = (base64: string): Uint8Array => {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

export const importSnapshot = (doc: LoroDoc, snapshotBase64: string): boolean => {
  try {
    const snapshotBytes = decodeSnapshot(snapshotBase64)
    doc.import(snapshotBytes)
    return true
  } catch (error) {
    console.error('[SNAPSHOT] Import failed:', error)
    return false
  }
}

export const exportSnapshot = (doc: LoroDoc): string | null => {
  try {
    const snapshot = doc.export({ mode: "snapshot" })
    return encodeSnapshot(snapshot)
  } catch (error) {
    console.error('[SNAPSHOT] Export failed:', error)
    return null
  }
} 