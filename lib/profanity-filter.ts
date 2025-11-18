/**
 * Profanity Filter System
 *
 * This file contains a multi-language profanity filter for Turkish and English.
 * Profane words are censored with asterisks (***) to maintain a clean community.
 */

// Turkish profanity list
const TURKISH_BAD_WORDS = [
  // Common Turkish profanity
  "amk", "amq", "aq", "mk",
  "orospu", "orsp",
  "pic", "pç",
  "got", "göt",
  "sik", "siktir", "siktr", "sktr", "sktir",
  "yarrak", "yarak",
  "amcik", "amcık",
  "pezevenk",
]

// English profanity list
const ENGLISH_BAD_WORDS = [
  // Common English profanity
  "fuck", "fck", "fuk",
  "shit", "sht",
  "bitch", "btch",
  "asshole",
  "bastard",
  "cunt",
  "dick",
  "whore",
]

// Combine all bad words
const ALL_BAD_WORDS = [...TURKISH_BAD_WORDS, ...ENGLISH_BAD_WORDS]

/**
 * Creates a simple regex pattern from a word
 */
function createSimplePattern(word: string): RegExp {
  // Escape special regex characters
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escapedWord}\\b`, 'gi')
}

/**
 * Checks if a text contains profanity
 */
export function containsProfanity(text: string): boolean {
  if (!text || typeof text !== 'string') return false

  const lowerText = text.toLowerCase()

  // Check for exact matches
  for (const word of ALL_BAD_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      return true
    }
  }

  return false
}

/**
 * Censors profanity in text by replacing it with asterisks
 */
export function censorProfanity(text: string): string {
  if (!text || typeof text !== 'string') return text

  let censoredText = text

  for (const word of ALL_BAD_WORDS) {
    const pattern = createSimplePattern(word)
    censoredText = censoredText.replace(pattern, (match) => {
      return '*'.repeat(match.length)
    })
  }

  return censoredText
}

/**
 * Gets a list of profane words found in text
 */
export function findProfanity(text: string): string[] {
  if (!text || typeof text !== 'string') return []

  const found: string[] = []
  const lowerText = text.toLowerCase()

  for (const word of ALL_BAD_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      found.push(word)
    }
  }

  return found
}

/**
 * Validates text and returns error if it contains profanity
 */
export function validateTextForProfanity(text: string): { isValid: boolean; error?: string } {
  if (containsProfanity(text)) {
    return {
      isValid: false,
      error: "Your message contains inappropriate language. Please be respectful."
    }
  }

  return { isValid: true }
}
