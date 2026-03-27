# Vanity Solana — Product Definition

## What is the end product?

A web-based Solana vanity address generator. Users visit the site, enter a desired prefix and/or suffix, configure options, and the app brute-forces Solana keypairs in-browser until it finds an address matching the pattern. The private key never leaves the user's browser.

## What does the user see and do?

1. Land on a single-page app with a clean, focused UI.
2. Enter a desired **prefix** and/or **suffix** for a Solana address.
3. Toggle **case-sensitive** matching on or off.
4. Click "Generate" — the app spawns multiple Web Workers to search in parallel.
5. See real-time stats: attempts/sec, total attempts, elapsed time.
6. When a match is found, the address and private key (base58) are displayed.
7. Copy address/key to clipboard with one click.
8. Option to download the keypair as a JSON file (Solana CLI compatible format).

## Who is the user?

Anyone who wants a custom/memorable Solana wallet address. Could be the project creator or any visitor. No accounts or auth needed.

## Core Features

- **Prefix matching** — find addresses starting with a specific string (after the leading base58 characters)
- **Suffix matching** — find addresses ending with a specific string
- **Combined prefix + suffix** — match both simultaneously
- **Case-sensitive toggle** — on by default, can be relaxed for faster results
- **Multi-threaded generation** — Web Workers run in parallel (auto-detect CPU cores)
- **Real-time stats** — attempts/sec, total attempts, elapsed time, estimated time remaining
- **In-browser only** — private keys never sent to any server
- **Keypair export** — copy to clipboard or download as JSON (Solana CLI compatible `[u8; 64]` format)
- **Stop/resume** — cancel generation at any time

## Tech Stack

See CLAUDE.md for detailed stack.

**Key decision:** Rust compiled to WebAssembly for keypair generation (10-50x faster than pure JS), running inside Web Workers for parallelism. React frontend for the UI.

## Acceptance Criteria

- [ ] User can enter a prefix and generate a matching Solana address
- [ ] User can enter a suffix and generate a matching Solana address
- [ ] User can combine prefix + suffix
- [ ] Case-sensitive toggle works correctly
- [ ] Generation runs in Web Workers (UI never freezes)
- [ ] Multiple workers run in parallel (scales with CPU cores)
- [ ] Real-time stats update during generation
- [ ] Found keypair displays address and private key
- [ ] Copy-to-clipboard works for both address and key
- [ ] Download keypair as JSON works
- [ ] Stop button cancels generation immediately
- [ ] Private key never leaves the browser
- [ ] Works in Chrome, Firefox, Edge (modern browsers with WASM support)

## Constraints

- All computation happens client-side (zero backend for generation)
- No accounts, no database, no server-side state
- Must be deployable as a static site (Vercel, Netlify, GitHub Pages, etc.)

## Edge Cases / What Could Go Wrong

- **Long patterns = long wait** — 5+ character prefixes could take minutes/hours. Show estimated time and warn users.
- **Invalid base58 characters** — Solana addresses are base58. Characters like `0`, `O`, `I`, `l` are invalid. Validate input and show clear error.
- **Browser tab closed** — generation is lost. Warn user if they try to close during generation.
- **Low-end devices** — fewer cores = slower. Show core count and let user adjust worker count.
- **Mobile browsers** — WASM + Workers support varies. Show a warning if unsupported.
