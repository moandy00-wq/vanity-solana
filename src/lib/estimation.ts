import type { Difficulty, DifficultyEstimate } from './types'

const CASE_SENSITIVE_ALPHABET_SIZE = 58
// Case-insensitive: 9 digits + 23 letter pairs (A/a..Z/z minus excluded) + 'i' alone + 'L' alone = 34
const CASE_INSENSITIVE_ALPHABET_SIZE = 34

const DEFAULT_SPEED_PER_WORKER = 30_000 // conservative estimate

export function getWorkerCount(): number {
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 0
  if (!cores || cores <= 1) return 1
  return Math.max(1, cores - 1)
}

export function estimateDifficulty(
  prefix: string,
  suffix: string,
  caseSensitive: boolean,
  measuredSpeed?: number,
): DifficultyEstimate {
  const totalLength = prefix.length + suffix.length

  if (totalLength === 0) {
    return {
      expectedAttempts: 1,
      estimatedTimeMs: 0,
      difficulty: 'instant',
      label: 'Enter a prefix or suffix',
    }
  }

  const alphabetSize = caseSensitive
    ? CASE_SENSITIVE_ALPHABET_SIZE
    : CASE_INSENSITIVE_ALPHABET_SIZE

  const expectedAttempts = Math.pow(alphabetSize, totalLength)

  const workerCount = getWorkerCount()
  const speed = measuredSpeed ?? DEFAULT_SPEED_PER_WORKER * workerCount
  const estimatedTimeMs = (expectedAttempts / speed) * 1000

  const difficulty = getDifficulty(estimatedTimeMs)
  const label = formatEstimate(estimatedTimeMs, difficulty)

  return { expectedAttempts, estimatedTimeMs, difficulty, label }
}

function getDifficulty(timeMs: number): Difficulty {
  if (timeMs < 5_000) return 'instant'
  if (timeMs < 120_000) return 'fast'
  if (timeMs < 1_800_000) return 'moderate'
  if (timeMs < 14_400_000) return 'long'
  return 'very-long'
}

function formatEstimate(timeMs: number, difficulty: Difficulty): string {
  if (difficulty === 'instant') return 'Should be instant'

  const label = formatDuration(timeMs)

  if (difficulty === 'long') return `~${label} — this will take a while`
  if (difficulty === 'very-long') return `~${label} — this could take a very long time`

  return `~${label}`
}

export function formatDuration(ms: number): string {
  if (ms < 1_000) return '< 1 second'

  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds} seconds`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`

  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  if (hours < 24) {
    return remainingMins > 0
      ? `${hours}h ${remainingMins}m`
      : `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? 's' : ''}`
}
