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
  "orospu", "orsp", "orsbcocu",
  "piç", "pic", "pç",
  "göt", "got", "götveren",
  "sik", "siktir", "siktr", "sktr", "sktir",
  "yarrak", "yrrak", "yarak",
  "am", "amcık", "amcik",
  "pezevenk", "pezevank", "pzvnk",
  "kahpe", "kahp",
  "sürtük", "surtuk", "srtk",
  "dangalak", "dalyarak", "dangalak",
  "gerizekalı", "gerizekalı", "gerzek",
  "salak", "aptal", "mal",
  // Variations and letter substitutions
  "4mk", "4mq", "s1k", "s1kt1r",
  "0rospu", "p1c", "g0t",
]

// English profanity list
const ENGLISH_BAD_WORDS = [
  // Common English profanity
  "fuck", "fck", "fuk", "f*ck", "f**k",
  "shit", "sh1t", "sht",
  "bitch", "b1tch", "btch",
  "ass", "asshole", "a$$",
  "bastard", "b4st4rd",
  "damn", "dmn",
  "cunt", "c*nt",
  "dick", "d1ck",
  "pussy", "psy",
  "whore", "wh0re",
  "slut", "sl*t",
  "faggot", "fag", "f4g",
  "nigger", "nigga", "n1gg4",
  "retard", "r3t4rd",
  // Variations
  "motherfucker", "mofo", "mf",
  "wtf", "stfu",
]

// Combine all bad words
const ALL_BAD_WORDS = [...TURKISH_BAD_WORDS, ...ENGLISH_BAD_WORDS]

/**
 * Creates a regex pattern from a word to match variations
 * (e.g., with spaces between letters, uppercase/lowercase, etc.)
 */
function createFlexiblePattern(word: string): RegExp {
  // Replace each letter with a pattern that allows spaces and special chars
  const pattern = word
    .split('')
    .map(char => {
      // Allow letter substitutions (a->4, e->3, i->1, o->0, s->$, etc.)
      if (char.toLowerCase() === 'a') return '[a4@]'
      if (char.toLowerCase() === 'e') return '[e3]'
      if (char.toLowerCase() === 'i') return '[i1!|]'
      if (char.toLowerCase() === 'o') return '[o0]'
      if (char.toLowerCase() === 's') return '[s$5]'
      if (char.toLowerCase() === 't') return '[t7]'
      return char
    })
    .join('[\\s\\-_\\.]*') // Allow spaces, dashes, underscores, dots between chars

  return new RegExp(pattern, 'gi')
}

/**
 * Checks if a text contains profanity
 */
export function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase()

  // Check for exact matches and variations
  for (const word of ALL_BAD_WORDS) {
    const pattern = createFlexiblePattern(word)
    if (pattern.test(lowerText)) {
      return true
    }
  }

  return false
}

/**
 * Censors profanity in text by replacing it with asterisks
 */
export function censorProfanity(text: string): string {
  let censoredText = text

  for (const word of ALL_BAD_WORDS) {
    const pattern = createFlexiblePattern(word)
    censoredText = censoredText.replace(pattern, (match) => {
      // Replace with asterisks of same length
      return '*'.repeat(Math.max(match.length, 3))
    })
  }

  return censoredText
}

/**
 * Gets a list of profane words found in text
 */
export function findProfanity(text: string): string[] {
  const found: string[] = []
  const lowerText = text.toLowerCase()

  for (const word of ALL_BAD_WORDS) {
    const pattern = createFlexiblePattern(word)
    if (pattern.test(lowerText)) {
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
