import type { GenerationStats, KeypairResult, WorkerOutMessage } from './types'
import { getWorkerCount } from './estimation'

interface WorkerPoolConfig {
  prefix: string
  suffix: string
  caseSensitive: boolean
  expectedAttempts: number
  onProgress: (stats: GenerationStats) => void
  onFound: (result: KeypairResult) => void
  onError: (error: string) => void
}

export class WorkerPool {
  private workers: Worker[] = []
  private config: WorkerPoolConfig
  private totalAttempts = 0
  private startTime = 0
  private stopped = false
  private activeWorkers = 0
  private rafId: number | null = null

  constructor(config: WorkerPoolConfig) {
    this.config = config
  }

  async start(): Promise<void> {
    const wasmUrl = new URL('../wasm-pkg/vanity_solana_wasm_bg.wasm', import.meta.url).href
    const wasmResponse = await fetch(wasmUrl)
    const wasmBytes = await wasmResponse.arrayBuffer()

    const workerCount = getWorkerCount()
    this.startTime = performance.now()
    this.totalAttempts = 0
    this.stopped = false
    this.activeWorkers = workerCount

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(
        new URL('../workers/vanity-worker.ts', import.meta.url),
        { type: 'module' }
      )

      worker.onmessage = (e: MessageEvent<WorkerOutMessage>) => {
        if (this.stopped) return
        this.handleWorkerMessage(e.data)
      }

      worker.onerror = (err) => {
        this.activeWorkers--
        console.error('Worker error:', err)
        if (this.activeWorkers <= 0 && !this.stopped) {
          this.config.onError('All workers failed. Your browser may not support this tool.')
        }
      }

      worker.postMessage({
        type: 'start',
        wasmBytes: wasmBytes.slice(0), // clone for each worker
        prefix: this.config.prefix,
        suffix: this.config.suffix,
        caseSensitive: this.config.caseSensitive,
      })

      this.workers.push(worker)
    }

    // Start progress reporting via requestAnimationFrame
    this.scheduleProgressUpdate()
  }

  private pendingAttempts = 0

  private handleWorkerMessage(msg: WorkerOutMessage) {
    switch (msg.type) {
      case 'progress':
        this.pendingAttempts += msg.attempts
        break

      case 'found':
        this.stopped = true
        this.cancelProgressUpdate()
        this.terminateAll()
        this.config.onFound({
          address: msg.address,
          privateKeyBase58: msg.privateKeyBase58,
          keypairJson: msg.keypairJson,
          verified: false, // will be verified by the hook
        })
        break

      case 'error':
        this.activeWorkers--
        console.error('Worker reported error:', msg.message)
        if (this.activeWorkers <= 0 && !this.stopped) {
          this.config.onError(msg.message)
        }
        break
    }
  }

  private scheduleProgressUpdate() {
    this.rafId = requestAnimationFrame(() => {
      if (this.stopped) return

      // Flush pending attempts
      this.totalAttempts += this.pendingAttempts
      this.pendingAttempts = 0

      const elapsedMs = performance.now() - this.startTime
      const elapsedSec = elapsedMs / 1000
      const attemptsPerSecond = elapsedSec > 0 ? Math.round(this.totalAttempts / elapsedSec) : 0

      const remaining = attemptsPerSecond > 0
        ? ((this.config.expectedAttempts - this.totalAttempts) / attemptsPerSecond) * 1000
        : null

      this.config.onProgress({
        totalAttempts: this.totalAttempts,
        attemptsPerSecond,
        elapsedMs,
        workerCount: this.activeWorkers,
        estimatedTimeRemainingMs: remaining && remaining > 0 ? remaining : null,
      })

      this.scheduleProgressUpdate()
    })
  }

  private cancelProgressUpdate() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  stop() {
    this.stopped = true
    this.cancelProgressUpdate()
    // Send stop to all workers, then terminate after grace period
    for (const worker of this.workers) {
      worker.postMessage({ type: 'stop' })
    }
    setTimeout(() => this.terminateAll(), 200)
  }

  private terminateAll() {
    for (const worker of this.workers) {
      worker.terminate()
    }
    this.workers = []
  }

  destroy() {
    this.stopped = true
    this.cancelProgressUpdate()
    this.terminateAll()
  }

  getWorkerCount(): number {
    return this.activeWorkers
  }
}
