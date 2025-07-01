export const getWordCount = (text: string): number => {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0)
  return words.length
}

export const getCharacterCount = (text: string): number => {
  return text.length
}

export const getReadingTime = (wordCount: number): number => {
  // Average reading speed: 200-250 words per minute
  const wordsPerMinute = 225
  return Math.ceil(wordCount / wordsPerMinute)
} 