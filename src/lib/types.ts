// Worker message types
export type WorkerInMessage =
  | { type: 'start'; wasmBytes: ArrayBuffer; prefix: string; suffix: string; caseSensitive: boolean }
  | { type: 'stop' }

export type WorkerOutMessage =
  | { type: 'progress'; attempts: number }
  | { type: 'found'; address: string; privateKeyBase58: string; keypairJson: string }
  | { type: 'error'; message: string }

// UI state types
export interface GenerationStats {
  totalAttempts: number
  attemptsPerSecond: number
  elapsedMs: number
  workerCount: number
  estimatedTimeRemainingMs: number | null
}

export interface KeypairResult {
  address: string
  privateKeyBase58: string
  keypairJson: string
  verified: boolean
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export type GeneratorState = 'idle' | 'loading' | 'generating' | 'found'

export type Difficulty = 'instant' | 'fast' | 'moderate' | 'long' | 'very-long'

export interface DifficultyEstimate {
  expectedAttempts: number
  estimatedTimeMs: number
  difficulty: Difficulty
  label: string
}
