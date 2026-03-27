import type { GenerationStats } from '../lib/types'
import { formatDuration } from '../lib/estimation'

interface StatsProps {
  stats: GenerationStats
}

const formatNumber = (n: number): string => {
  return new Intl.NumberFormat().format(n)
}

const Stats = ({ stats }: StatsProps) => {
  return (
    <div className="animate-fade-in-up rounded-lg border border-zinc-800 bg-zinc-900 p-4 animate-pulse-border">
      <div className="grid grid-cols-2 gap-4">
        <StatItem
          label="Speed"
          value={`${formatNumber(stats.attemptsPerSecond)}/sec`}
        />
        <StatItem
          label="Total Attempts"
          value={formatNumber(stats.totalAttempts)}
        />
        <StatItem
          label="Elapsed"
          value={formatDuration(stats.elapsedMs)}
        />
        <StatItem
          label="Est. Remaining"
          value={
            stats.estimatedTimeRemainingMs
              ? `~${formatDuration(stats.estimatedTimeRemainingMs)}`
              : 'Calculating...'
          }
        />
      </div>
      <p className="mt-3 text-xs text-zinc-600">
        Using {stats.workerCount} CPU core{stats.workerCount !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
      {label}
    </p>
    <p className="mt-1 font-mono text-lg font-semibold text-zinc-50">
      {value}
    </p>
  </div>
)

export { Stats }
