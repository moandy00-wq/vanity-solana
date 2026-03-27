import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { Generator } from './components/Generator'
import { Stats } from './components/Stats'
import { Result } from './components/Result'
import { useVanityGenerator } from './hooks/useVanityGenerator'

function checkBrowserSupport(): string | null {
  if (typeof WebAssembly === 'undefined') return 'WebAssembly is not supported.'
  if (typeof Worker === 'undefined') return 'Web Workers are not supported.'
  if (typeof crypto?.getRandomValues !== 'function') return 'Secure random number generation is not available.'
  if (typeof globalThis.isSecureContext !== 'undefined' && !globalThis.isSecureContext) {
    return 'This tool requires HTTPS. Please access it over a secure connection.'
  }
  return null
}

const App = () => {
  const [browserError, setBrowserError] = useState<string | null>(null)

  useEffect(() => {
    setBrowserError(checkBrowserSupport())
  }, [])

  const gen = useVanityGenerator()

  if (browserError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950 px-4">
        <div className="max-w-md text-center">
          <p className="font-display text-lg font-semibold text-zinc-50">
            Browser Not Supported
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            {browserError}
          </p>
          <p className="mt-4 text-xs text-zinc-500">
            Please use a modern browser (Chrome 80+, Firefox 114+, Edge 80+, Safari 15.5+) over HTTPS.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-zinc-950">
      <div className="mx-auto max-w-lg px-4 py-12">
        <Header />

        <div className="space-y-6">
          {gen.state !== 'found' && (
            <Generator
              prefix={gen.prefix}
              suffix={gen.suffix}
              caseSensitive={gen.caseSensitive}
              validation={gen.validation}
              estimate={gen.estimate}
              state={gen.state}
              error={gen.error}
              onPrefixChange={gen.setPrefix}
              onSuffixChange={gen.setSuffix}
              onCaseSensitiveChange={gen.setCaseSensitive}
              onGenerate={gen.start}
              onStop={gen.stop}
            />
          )}

          {gen.state === 'generating' && gen.stats && (
            <Stats stats={gen.stats} />
          )}

          {gen.state === 'found' && gen.result && (
            <Result result={gen.result} onReset={gen.reset} />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
