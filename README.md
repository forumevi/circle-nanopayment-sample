# Circle Arc Testnet — x402 Autonomous Payment Sample

A minimal end-to-end proof-of-concept showing how an AI agent can autonomously pay for API access using the [x402 protocol](https://x402.org), [Circle USDC](https://www.circle.com/usdc), and Circle's **Arc testnet** (Circle's own EVM-compatible L1).

## What This Demonstrates

```
Client (AI agent)                Server (paid API)           Facilitator (local)
─────────────────                ─────────────────           ───────────────────
GET /risk-profile   ──────────►  402 Payment Required
                    ◄──────────  { accepts: [{ network: "arc-testnet", price: "$0.01" }] }

sign EIP-3009
TransferWithAuthorization

GET /risk-profile   ──────────►  decode X-PAYMENT header
  X-PAYMENT: <sig>               POST /verify  ────────────► isValid: true
                                 POST /settle  ────────────► tx on Arc chain ✅
                    ◄──────────  200 { risk_score: 87, ... }
```

**Key facts:**
- No Circle API key required — uses local private keys
- Payment signed client-side with [viem](https://viem.sh) EIP-712 / EIP-3009
- Local facilitator handles verify + on-chain USDC settlement
- $0.01 USDC transferred per API call, settled on Arc testnet

---

## Arc Testnet

| Field | Value |
|-------|-------|
| Chain ID | 5042002 |
| RPC | `https://rpc.testnet.arc.network` |
| USDC | `0x3600000000000000000000000000000000000000` |
| Explorer | https://testnet.arcscan.app |
| Faucet | https://faucet.circle.com |

---

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Patch x402 for Arc testnet

The `x402` package (v1.1.0) doesn't include Arc testnet in its built-in network list. Apply the patch:

```bash
node patch-x402.mjs
```

This adds `arc-testnet` (chain ID 5042002) to the `SupportedEVMNetworks`, `EvmNetworkToChainId`, and USDC config in all x402 dist files (both ESM and CJS).

> **Note:** Re-run this after `npm install` since it modifies `node_modules`.

### 3. Generate keys

```bash
npm run setup
```

Copy the output into `.env`:

```
CLIENT_PRIVATE_KEY=0x...
SERVER_PRIVATE_KEY=0x...
SERVER_ADDRESS=0x...
```

### 4. Fund wallets

Go to **https://faucet.circle.com**, select **Arc Testnet** + **USDC**, and fund both the client and server addresses printed by `npm run setup`.

### 5. Run (3 terminals)

```bash
# Terminal 1 — payment facilitator (verify + settle on Arc chain)
npm run facilitator

# Terminal 2 — paywalled API server
npm run server

# Terminal 3 — AI agent client
npm run client
```

**Expected output (client):**

```
Wallet: 0xF8eBf...
Calling http://localhost:4021/risk-profile ...

Got 402. Payment required: { scheme: "exact", network: "arc-testnet", ... }

Payment payload network: arc-testnet
Payment signed. Retrying with X-PAYMENT header...

✅ Payment complete! Response:
{
  "risk_score": 87,
  "risk_level": "high",
  "recommendation": "block_transaction"
}
```

**Expected output (facilitator):**

```
[FACILITATOR] verify called, network: arc-testnet
[FACILITATOR] verify result: {"isValid":true,"payer":"0x..."}
[FACILITATOR] settle called, network: arc-testnet
[FACILITATOR] settle result: {"success":true,"transaction":"0x...","network":"arc-testnet"}
```

---

## Architecture

### `src/server.ts` — Paywalled API
Express server on port 4021. Uses `x402-express` middleware to gate `GET /risk-profile` behind a $0.01 USDC payment requirement. Points to the local facilitator at `http://localhost:4022`.

### `src/facilitator.ts` — Local x402 Facilitator
Express server on port 4022. Implements the x402 facilitator protocol (`/verify`, `/settle`, `/supported`) using viem clients connected to Arc testnet. The wallet client is extended with `publicActions` (required for EIP-712 signature verification during settlement).

### `src/client.ts` — Autonomous Payment Client
Simulates an AI agent that:
1. Calls the API → receives 402 with payment requirements
2. Signs an EIP-3009 `TransferWithAuthorization` using its Arc testnet wallet
3. Retries the request with the `X-PAYMENT` header
4. Receives the paid response

### `src/setup.ts` — Key Generator
Generates client and server private keys and prints the addresses to fund.

---

## x402 Protocol Flow

The [x402 protocol](https://github.com/coinbase/x402) is a standard for HTTP micropayments:

1. **402 Response** — server returns payment requirements (scheme, network, amount, payTo address, asset)
2. **Client signs** — EIP-3009 `TransferWithAuthorization` permits the server to pull USDC without a prior `approve` transaction
3. **X-PAYMENT header** — base64-encoded signed authorization sent with the retry request
4. **Facilitator verifies** — checks signature validity, amounts, expiry
5. **Facilitator settles** — submits `transferWithAuthorization` to the USDC contract on Arc, transferring funds
6. **Server responds** — returns the actual API response with `X-PAYMENT-RESPONSE` header

---

## Why Arc Testnet?

Arc is Circle's own EVM-compatible L1 where USDC is the native gas token, making it ideal for demonstrating USDC micropayments with minimal friction. The `x402` library v1.1.0 doesn't include Arc in its built-in network list — this sample includes a patch script to add it.

---

## Project Structure

```
circle-sample/
├── src/
│   ├── setup.ts         # Generate keypairs
│   ├── server.ts        # Paywalled API (port 4021)
│   ├── facilitator.ts   # x402 facilitator (port 4022)
│   └── client.ts        # Autonomous payment client
├── patch-x402.mjs       # Adds arc-testnet to x402 node_modules
├── .env.example
├── package.json
└── tsconfig.json
```
