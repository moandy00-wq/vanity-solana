import type { ValidationResult } from './types'

export const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

// ~94% of Ed25519 keypair addresses are 44 chars and can only start with these.
// The remaining ~6% are 43 chars and can start with ANY base58 character.
const COMMON_FIRST_CHARS = '123456789ABCDEFGHJ'

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

export function isRareFirstChar(char: string): boolean {
  return char.length > 0 && !COMMON_FIRST_CHARS.includes(char[0]!)
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

  // Warn about rare first characters (valid but ~58x slower to find)
  if (prefix.length > 0 && invalidPrefix.length === 0 && isRareFirstChar(prefix)) {
    warnings.push(
      `Addresses starting with '${prefix[0]}' are rare (~6% of keypairs). This will take ~58x longer than common first characters (1-9, A-H, J).`
    )
  }

  // Warn about '1' as first char
  if (prefix.length > 0 && prefix[0] === '1' && invalidPrefix.length === 0) {
    warnings.push("Addresses starting with '1' are extremely rare (~0.4% of keypairs).")
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
