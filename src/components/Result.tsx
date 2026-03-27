import { useState, useCallback } from 'react'
import type { KeypairResult } from '../lib/types'

interface ResultProps {
  result: KeypairResult
  onReset: () => void
}

const Result = ({ result, onReset }: ResultProps) => {
  const [showKey, setShowKey] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }, [])

  const downloadKeypair = useCallback(() => {
    const blob = new Blob([result.keypairJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vanity-solana-keypair.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [result.keypairJson])

  return (
    <div className="animate-fade-in-up space-y-4 rounded-lg border border-cyan-500/20 bg-zinc-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-cyan-400">
          Match Found
        </h2>
        {result.verified ? (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
            Verified
          </span>
        ) : (
          <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
            Unverified
          </span>
        )}
      </div>

      {/* Wallet Address */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Wallet Address
        </p>
        <div className="flex items-start gap-2">
          <code className="min-w-0 flex-1 break-all text-sm text-zinc-50">
            {result.address}
          </code>
          <button
            onClick={() => copyToClipboard(result.address, 'address')}
            className="shrink-0 rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-400 transition-all duration-150 hover:bg-zinc-800 hover:text-zinc-300"
          >
            {copiedField === 'address' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Private Key */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Private Key
        </p>
        {showKey ? (
          <div className="flex items-start gap-2">
            <code className="min-w-0 flex-1 break-all text-sm text-zinc-50">
              {result.privateKeyBase58}
            </code>
            <button
              onClick={() => copyToClipboard(result.privateKeyBase58, 'key')}
              className="shrink-0 rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-400 transition-all duration-150 hover:bg-zinc-800 hover:text-zinc-300"
            >
              {copiedField === 'key' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowKey(true)}
            className="text-sm text-cyan-400 transition-all duration-150 hover:text-cyan-300"
          >
            Click to reveal
          </button>
        )}
      </div>

      {/* Download */}
      <button
        onClick={downloadKeypair}
        className="w-full rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-all duration-150 hover:bg-zinc-800"
      >
        Download Keypair JSON
      </button>

      {/* Warning */}
      <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3">
        <p className="text-sm font-medium text-amber-400">
          Save your private key now. It will not be stored or recoverable after you leave this page.
        </p>
      </div>

      {/* Generate Another */}
      <button
        onClick={onReset}
        className="w-full rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-all duration-150 hover:bg-zinc-800 hover:text-zinc-300"
      >
        Generate Another
      </button>
    </div>
  )
}

export { Result }
