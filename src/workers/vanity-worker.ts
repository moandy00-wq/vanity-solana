let running = false

interface StartMessage {
  type: 'start'
  wasmBytes: ArrayBuffer
  prefix: string
  suffix: string
  caseSensitive: boolean
}

interface StopMessage {
  type: 'stop'
}

type InMessage = StartMessage | StopMessage

interface FoundMessage {
  type: 'found'
  address: string
  privateKeyBase58: string
  keypairJson: string
}

interface ProgressMessage {
  type: 'progress'
  attempts: number
}

interface ErrorMessage {
  type: 'error'
  message: string
}

type OutMessage = FoundMessage | ProgressMessage | ErrorMessage

function postMsg(msg: OutMessage) {
  postMessage(msg)
}

self.onmessage = async (e: MessageEvent<InMessage>) => {
  const msg = e.data

  if (msg.type === 'stop') {
    running = false
    return
  }

  if (msg.type === 'start') {
    let generate_vanity: (prefix: string, suffix: string, caseSensitive: boolean, batchSize: number) => unknown

    try {
      // Dynamically import the wasm-bindgen glue code
      const wasmModule = await import('../wasm-pkg/vanity_solana_wasm')

      // Initialize with raw bytes — initSync will compile the Module internally
      wasmModule.initSync({ module: msg.wasmBytes })
      generate_vanity = wasmModule.generate_vanity
    } catch (err) {
      postMsg({ type: 'error', message: `WASM init failed: ${err}` })
      return
    }

    running = true
    const { prefix, suffix, caseSensitive } = msg

    function runBatch() {
      if (!running) return

      try {
        const result = generate_vanity(prefix, suffix, caseSensitive, 1000) as {
          address: string
          privateKeyBase58: string
          keypairJson: string
        } | null | undefined

        postMsg({ type: 'progress', attempts: 1000 })

        if (result !== null && result !== undefined) {
          running = false
          postMsg({
            type: 'found',
            address: result.address,
            privateKeyBase58: result.privateKeyBase58,
            keypairJson: result.keypairJson,
          })
          return
        }
      } catch (err) {
        running = false
        postMsg({ type: 'error', message: `Generation error: ${err}` })
        return
      }

      // Yield to event loop so we can receive 'stop' messages
      setTimeout(runBatch, 0)
    }

    runBatch()
  }
}
