interface EditorStatusBarProps {
  wordCount: number
  isSaving: boolean
  lastSaved?: Date
  error?: string | null
}

export const EditorStatusBar = ({ 
  wordCount, 
  isSaving, 
  lastSaved,
  error 
}: EditorStatusBarProps) => {
  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-4">
      {error && (
        <span className="text-sm text-destructive">
          {error}
        </span>
      )}
      
      {isSaving && (
        <span className="text-sm text-muted-foreground/60">
          Saving...
        </span>
      )}
      
      {!isSaving && lastSaved && (
        <span className="text-sm text-muted-foreground/60">
          Saved
        </span>
      )}
      
      <span className="text-sm text-muted-foreground/60">
        {wordCount} {wordCount === 1 ? 'word' : 'words'}
      </span>
    </div>
  )
} 