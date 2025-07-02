import { Schema } from '@tiptap/pm/model'
import StarterKit from '@tiptap/starter-kit'
import { createLoroExtension } from '../loro'
import { LoroDoc } from 'loro-crdt'


export const schema = (loroDoc: LoroDoc) => [StarterKit, createLoroExtension(loroDoc)] 