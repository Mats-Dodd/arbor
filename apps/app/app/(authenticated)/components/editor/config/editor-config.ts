export const EDITOR_CONFIG = {
  AUTOSAVE_DELAY: 2000,
  TITLE_SAVE_DELAY: 500,
  
  DEFAULT_TITLE: 'Untitled',
  DEFAULT_NODE_ID: 'doc-node-1',
  
  EDITOR_CLASSES: {
    container: 'prose prose-lg max-w-none focus:outline-none min-h-[calc(100vh-16rem)]',
    wrapper: 'text-foreground [&_.ProseMirror]:min-h-[calc(100vh-20rem)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[\'Start_writing...\'] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground/50 [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none'
  },
  
  LAYOUT_CLASSES: {
    page: 'min-h-screen bg-background',
    content: 'mx-auto max-w-3xl px-12 py-8 sm:px-16 sm:py-12 md:px-20 md:py-16',
    backButton: 'inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors',
    titleInput: 'w-full bg-transparent text-2xl sm:text-3xl font-semibold text-foreground placeholder:text-muted-foreground/60 focus:outline-none mb-6 sm:mb-8 tracking-tight'
  },
  
  STORAGE_KEYS: {
    EDITOR_TITLE: 'editor-title'
  }
} 