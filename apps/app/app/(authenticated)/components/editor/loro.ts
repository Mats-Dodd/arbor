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


export const loroDoc = new LoroDoc()
// loroDoc.setPeerId("0");
// loroDoc.getText("text").insert(0, "Hello Loro 👋");
console.log('[LORO.ts] loroDoc.toJSON()', loroDoc.toJSON())
export const awareness = new CursorAwareness(loroDoc.peerIdStr)

export const LoroExtension = Extension.create({
  name: 'loro',
  addProseMirrorPlugins() {
    return [
      LoroSyncPlugin({ doc: loroDoc as any }),      
      LoroUndoPlugin({ doc: loroDoc as any }),
      keymap({
        'Mod-z': undo,
        'Mod-y': redo,
        'Mod-Shift-z': redo,
      }),
      LoroCursorPlugin(awareness, {}),
    ]
  },
})
