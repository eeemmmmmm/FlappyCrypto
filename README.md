# Flippy Flappy Crypto

Arcade game built on Base with on-chain score tracking and WalletConnect AppKit integration.

## Getting Started

```bash
npm install
cp .env.example .env # set VITE_WALLETCONNECT_PROJECT_ID
npm run dev
```

## WalletConnect Integration

- Uses `@reown/appkit` with Wagmi adapter targeting Base mainnet.
- Game saves scores to `FlappyCryptoScore` contract (`0xe5b742f5f72b1cb7b80862e685936887f8cc772f`).
- Leaderboard reads on-chain data via `viem` public client.
- AppKit modal handles wallet connections, session state, and transaction prompts.

## Scripts

- `npm run dev` – start Vite dev server.
- `npm run build` – bundle production assets (`dist/`).
- `npm run preview` – serve the production build locally.

## Project Structure

```
src/
  main.js             # entry script initializing AppKit + game
  game.js             # canvas game logic (Flappy-style)
  wallet/
    appKit.js         # AppKit + Wagmi adapter setup
    controls.js       # contract helpers (read/write)
  contract/
    abi.js            # ABI fragment used by viem
  style.css           # UI styling
```

## Environment

Create `.env` with:

```
VITE_WALLETCONNECT_PROJECT_ID=3508054afe4bb846303d0a312d748a8b
```

> Never commit private IDs if they shouldn’t be public.

## Proof of Usage

- WalletConnect sessions + sign/tx requests recorded via AppKit telemetry.
- Contract interactions visible on Base explorer.
- Game repository + commits document integration work.
