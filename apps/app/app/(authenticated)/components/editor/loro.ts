import { keymap } from 'prosemirror-keymap'
import { LoroDoc } from 'loro-crdt'
import { Extension } from '@tiptap/core'
import {
  CursorAwareness,
  LoroCursorPlugin,
  LoroSyncPlugin,
  LoroUndoPlugin,
  undo, redo,
} from 'loro-prosemirror'

export const createLoroDoc = () => {
  const doc = new LoroDoc()
  return doc
}

export const createLoroExtension = (doc: LoroDoc) => {
  const awareness = new CursorAwareness(doc.peerIdStr)
  
  return Extension.create({
    name: 'loro',
    addProseMirrorPlugins() {
      return [
        LoroSyncPlugin({ doc: doc as any }),      
        LoroUndoPlugin({ doc: doc as any }),
        keymap({
          'Mod-z': undo,
          'Mod-y': redo,
          'Mod-Shift-z': redo,
        }),
        LoroCursorPlugin(awareness, {}),
      ]
    },
  })
}
