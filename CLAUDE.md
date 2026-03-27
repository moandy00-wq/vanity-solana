# Vanity Solana

A web-based Solana vanity address generator that runs entirely in the browser. Uses Rust compiled to WebAssembly for high-performance keypair generation, parallelized across Web Workers, with a React frontend.

## Tech Stack

| Library / Tool | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 6 | Build tool, dev server, WASM plugin |
| TypeScript | 5.x | Type safety |
| Tailwind CSS v4 | 4.x | Styling |
| Rust | stable | WASM keypair generation module |
| wasm-pack | latest | Compile Rust to WASM |
| ed25519-dalek | 2.x | Fast Ed25519 keypair generation |
| bs58 | 0.5.x | Base58 encoding in Rust |
| vite-plugin-wasm | latest | WASM support in Vite |
| Web Workers API | native | Parallel generation threads |

## Build Commands

```bash
# Install frontend dependencies
npm install

# Build WASM module (from /wasm directory)
cd wasm && wasm-pack build --target web --out-dir ../src/wasm-pkg && cd ..

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Format
npx prettier --write .
```

## Code Style

- TypeScript strict mode enabled
- Functional React components only (no classes)
- Named exports (no default exports except pages)
- Use `const` arrow functions for components
- Tailwind for all styling — no CSS modules, no styled-components
- Worker communication via typed message interfaces
- Rust code uses standard `rustfmt` formatting

## Architecture

```
vanity-solana/
├── public/
├── wasm/                        # Rust WASM crate
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs               # Keypair generation + matching logic
├── src/
│   ├── wasm-pkg/                # wasm-pack output (gitignored build artifact)
│   ├── workers/
│   │   └── vanity-worker.ts     # Web Worker — loads WASM, generates keypairs
│   ├── components/
│   │   ├── Generator.tsx        # Main generator form + controls
│   │   ├── Stats.tsx            # Real-time generation stats
│   │   ├── Result.tsx           # Found keypair display + copy/download
│   │   └── Header.tsx           # App header
│   ├── lib/
│   │   ├── worker-pool.ts       # Manages Web Worker lifecycle
│   │   ├── validation.ts        # Base58 input validation
│   │   └── types.ts             # Shared TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                # Tailwind imports + globals
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── definition.md
└── CLAUDE.md
```

**Data flow:**
1. User enters pattern in `Generator` component
2. `Generator` validates input via `validation.ts`
3. On "Generate", `worker-pool.ts` spawns N Web Workers
4. Each worker loads the WASM module and enters a generate-check loop
5. Workers post progress updates (attempts count) back to main thread
6. `Stats` component displays aggregated real-time stats
7. When a worker finds a match, it posts the keypair back
8. `Result` component displays the address + private key
9. All other workers are terminated

## Design Tokens

- **Accent color:** cyan (cyan-400 primary, cyan-500 hover)
- **Gray family:** zinc
- **Font:** Space Grotesk (display) + Inter (body)
- **Border radius scale:** 6/8/12/16 (modern SaaS)
- **Mood:** Bold/technical (Vercel-like)
- **Mode:** Dark mode only

## Testing Requirements

- Validate base58 character filtering works correctly
- Validate prefix/suffix matching logic (case-sensitive and insensitive)
- Validate worker pool spawns and terminates correctly
- Validate keypair export produces Solana CLI compatible JSON
- WASM module should have Rust unit tests for the matching logic

## Environment Variables

None required — fully client-side application.

## Rules

- Private keys must NEVER be transmitted over any network
- All cryptographic operations happen in WASM/Workers only
- Validate all user input against base58 character set before starting generation
- Always show security notice that keys are generated locally
- Workers must be cleanly terminated when generation stops
- UI must remain responsive during generation (no main-thread crypto)
