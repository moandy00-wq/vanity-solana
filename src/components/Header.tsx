const Header = () => {
  return (
    <header className="mb-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-50">
        Vanity Solana
      </h1>
      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="7" width="10" height="8" rx="1.5" />
          <path d="M5 7V5a3 3 0 0 1 6 0v2" />
        </svg>
        <span>Keys generated locally — never sent to a server</span>
      </div>
    </header>
  )
}

export { Header }
