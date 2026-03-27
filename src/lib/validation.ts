import type { ValidationResult } from './types'

export const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

// Valid first characters for 44-char Solana addresses (32-byte Ed25519 pubkeys)
// Max 32-byte value in base58 starts with 'J', so only chars up to 'J' are valid
const VALID_FIRST_CHARS = '123456789ABCDEFGHJ'

const base58Set = new Set(BASE58_ALPHABET)

export function getInvalidChars(input: string): string[] {
  const invalid: string[] = []
  for (const ch of input) {
    if (!base58Set.has(ch) && !invalid.includes(ch)) {
      invalid.push(ch)
    }
  }
  return invalid
}

export function isImpossibleFirstChar(char: string): boolean {
  return char.length > 0 && !VALID_FIRST_CHARS.includes(char[0]!)
}

export function validateVanityInput(prefix: string, suffix: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for invalid base58 characters in prefix
  const invalidPrefix = getInvalidChars(prefix)
  if (invalidPrefix.length > 0) {
    errors.push(
      `Prefix contains invalid characters: ${invalidPrefix.map(c => `'${c}'`).join(', ')}. Base58 excludes 0, O, I, l.`
    )
  }

  // Check for invalid base58 characters in suffix
  const invalidSuffix = getInvalidChars(suffix)
  if (invalidSuffix.length > 0) {
    errors.push(
      `Suffix contains invalid characters: ${invalidSuffix.map(c => `'${c}'`).join(', ')}. Base58 excludes 0, O, I, l.`
    )
  }

  // Check for impossible first character
  if (prefix.length > 0 && invalidPrefix.length === 0 && isImpossibleFirstChar(prefix)) {
    errors.push(
      `Solana addresses cannot start with '${prefix[0]}'. Valid first characters: 1-9, A-H, J.`
    )
  }

  // Warnings for difficulty
  if (prefix.length > 0 && prefix[0] === '1' && invalidPrefix.length === 0) {
    warnings.push("Addresses starting with '1' are extremely rare (~1/256 chance per attempt).")
  }

  const totalLength = prefix.length + suffix.length
  if (totalLength === 5) {
    warnings.push('This pattern may take 30+ minutes to find.')
  } else if (totalLength >= 6) {
    warnings.push('This pattern could take hours or days. Are you sure?')
  }

  return {
    valid: errors.length === 0 && (prefix.length > 0 || suffix.length > 0),
    errors,
    warnings,
  }
}
