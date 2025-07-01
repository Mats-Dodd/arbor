import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'


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

export const validateMarkdownContent = (content: string): boolean => {
  const trimmed = content.trim()
  return trimmed.length > 0
} 