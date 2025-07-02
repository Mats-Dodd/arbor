import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'

import { marked } from 'marked'
import { DOMParser as PMDOMParser } from 'prosemirror-model'
import { schema } from '../schema'
import { LoroDoc } from 'loro-crdt'
import { getSchema } from '@tiptap/core'




export const markdownToJSON = (markdownContent: string) => {
  const editor = new Editor({
    extensions: [
      StarterKit,
      Markdown
    ],
    content: markdownContent
  })

  const json = editor.getJSON()
  
  editor.destroy()
  
  return json
}

export function mdToPM(markdown: string, loroDoc: LoroDoc) {
  const html = marked.parse(markdown, { async: false }) as string
  const dom = document.createElement('div')
  dom.innerHTML = html
  
  const extensions = schema(loroDoc)
  const pmSchema = getSchema(extensions)
  
  const doc = PMDOMParser.fromSchema(pmSchema).parse(dom)
  return doc.toJSON()
}


export const validateMarkdownContent = (content: string): boolean => {
  const trimmed = content.trim()
  return trimmed.length > 0
} 