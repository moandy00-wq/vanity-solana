import type { ValidationResult, DifficultyEstimate, GeneratorState } from '../lib/types'

interface GeneratorProps {
  prefix: string
  suffix: string
  caseSensitive: boolean
  validation: ValidationResult
  estimate: DifficultyEstimate | null
  state: GeneratorState
  error: string | null
  onPrefixChange: (v: string) => void
  onSuffixChange: (v: string) => void
  onCaseSensitiveChange: (v: boolean) => void
  onGenerate: () => void
  onStop: () => void
}

const Generator = ({
  prefix,
  suffix,
  caseSensitive,
  validation,
  estimate,
  state,
  error,
  onPrefixChange,
  onSuffixChange,
  onCaseSensitiveChange,
  onGenerate,
  onStop,
}: GeneratorProps) => {
  const isRunning = state === 'generating' || state === 'loading'
  const canGenerate = validation.valid && !isRunning
  const hasInput = prefix.length > 0 || suffix.length > 0

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Prefix
          </label>
          <input
            type="text"
            value={prefix}
            onChange={(e) => onPrefixChange(e.target.value)}
            placeholder="e.g., SOL"
            disabled={isRunning}
            className={`w-full rounded-md border bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-50 placeholder-zinc-600 outline-none transition-all duration-150 ${
              prefix.length > 0 && validation.errors.some(e => e.includes('Prefix') || e.includes('cannot start'))
                ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/50'
                : 'border-zinc-800 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/50'
            } disabled:opacity-50`}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Suffix
          </label>
          <input
            type="text"
            value={suffix}
            onChange={(e) => onSuffixChange(e.target.value)}
            placeholder="e.g., xyz"
            disabled={isRunning}
            className={`w-full rounded-md border bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-50 placeholder-zinc-600 outline-none transition-all duration-150 ${
              suffix.length > 0 && validation.errors.some(e => e.includes('Suffix'))
                ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/50'
                : 'border-zinc-800 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/50'
            } disabled:opacity-50`}
          />
        </div>
      </div>

      {/* Case sensitive toggle */}
      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(e) => onCaseSensitiveChange(e.target.checked)}
          disabled={isRunning}
          className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0"
        />
        Case sensitive
      </label>

      {/* Validation errors */}
      {validation.errors.length > 0 && (
        <div className="space-y-1">
          {validation.errors.map((err, i) => (
            <p key={i} className="text-xs text-red-400">{err}</p>
          ))}
        </div>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && validation.errors.length === 0 && (
        <div className="space-y-1">
          {validation.warnings.map((warn, i) => (
            <p key={i} className="text-xs text-amber-400">{warn}</p>
          ))}
        </div>
      )}

      {/* Difficulty estimate */}
      {estimate && hasInput && validation.errors.length === 0 && (
        <p className={`text-xs font-medium ${
          estimate.difficulty === 'instant' || estimate.difficulty === 'fast'
            ? 'text-cyan-400'
            : estimate.difficulty === 'moderate'
              ? 'text-amber-400'
              : 'text-red-400'
        }`}>
          {estimate.label}
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Generate / Stop button */}
      {state === 'loading' ? (
        <button
          disabled
          className="w-full rounded-md bg-cyan-500 py-2.5 text-sm font-semibold text-zinc-950 opacity-50"
        >
          Loading...
        </button>
      ) : state === 'generating' ? (
        <button
          onClick={onStop}
          className="w-full rounded-md bg-red-500 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-red-400"
        >
          Stop
        </button>
      ) : (
        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          className="w-full rounded-md bg-cyan-500 py-2.5 text-sm font-semibold text-zinc-950 transition-all duration-150 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Generate
        </button>
      )}
    </div>
  )
}

export { Generator }
