import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type {
  GeneratorState,
  GenerationStats,
  KeypairResult,
  ValidationResult,
  DifficultyEstimate,
} from '../lib/types'
import { validateVanityInput } from '../lib/validation'
import { estimateDifficulty } from '../lib/estimation'
import { WorkerPool } from '../lib/worker-pool'

export function useVanityGenerator() {
  const [state, setState] = useState<GeneratorState>('idle')
  const [stats, setStats] = useState<GenerationStats | null>(null)
  const [result, setResult] = useState<KeypairResult | null>(null)
  const [prefix, setPrefix] = useState('')
  const [suffix, setSuffix] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const poolRef = useRef<WorkerPool | null>(null)

  const validation: ValidationResult = useMemo(
    () => validateVanityInput(prefix, suffix),
    [prefix, suffix]
  )

  const estimate: DifficultyEstimate | null = useMemo(() => {
    if (prefix.length === 0 && suffix.length === 0) return null
    return estimateDifficulty(prefix, suffix, caseSensitive)
  }, [prefix, suffix, caseSensitive])

  const start = useCallback(async () => {
    if (!validation.valid) return

    setError(null)
    setState('loading')
    setStats(null)
    setResult(null)

    const est = estimateDifficulty(prefix, suffix, caseSensitive)

    const pool = new WorkerPool({
      prefix,
      suffix,
      caseSensitive,
      expectedAttempts: est.expectedAttempts,
      onProgress: (s) => setStats(s),
      onFound: async (keypairResult) => {
        // Verify the keypair
        try {
          const wasmUrl = new URL('../wasm-pkg/vanity_solana_wasm_bg.wasm', import.meta.url).href
          const wasmResponse = await fetch(wasmUrl)
          const wasmBytes = await wasmResponse.arrayBuffer()

          const { initSync, verify_keypair } = await import('../wasm-pkg/vanity_solana_wasm')
          initSync({ module: wasmBytes })

          // Parse seed from keypairJson (first 32 bytes of the 64-byte array)
          const keypairArray: number[] = JSON.parse(keypairResult.keypairJson)
          const seedBytes = new Uint8Array(keypairArray.slice(0, 32))
          const verifyResult = verify_keypair(seedBytes)

          if (verifyResult && verifyResult.address === keypairResult.address) {
            keypairResult.verified = true
          }
        } catch {
          // Verification failed — still show result but mark unverified
          keypairResult.verified = false
        }

        setResult(keypairResult)
        setState('found')
      },
      onError: (msg) => {
        setError(msg)
        setState('idle')
      },
    })

    poolRef.current = pool

    try {
      await pool.start()
      setState('generating')
    } catch (err) {
      setError(`Failed to start: ${err}`)
      setState('idle')
    }
  }, [prefix, suffix, caseSensitive, validation.valid])

  const stop = useCallback(() => {
    poolRef.current?.stop()
    poolRef.current = null
    setState('idle')
    setStats(null)
  }, [])

  const reset = useCallback(() => {
    poolRef.current?.destroy()
    poolRef.current = null
    setState('idle')
    setStats(null)
    setResult(null)
    setError(null)
  }, [])

  // beforeunload warning during generating AND found states
  useEffect(() => {
    if (state === 'generating' || state === 'found') {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault()
      }
      window.addEventListener('beforeunload', handler)
      return () => window.removeEventListener('beforeunload', handler)
    }
  }, [state])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      poolRef.current?.destroy()
    }
  }, [])

  return {
    state,
    stats,
    result,
    validation,
    estimate,
    prefix,
    suffix,
    caseSensitive,
    error,
    setPrefix,
    setSuffix,
    setCaseSensitive,
    start,
    stop,
    reset,
  }
}
