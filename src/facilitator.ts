/**
 * Local x402 facilitator for Arc testnet.
 * Handles /verify and /settle HTTP endpoints.
 * Run this alongside server.ts.
 */
import 'dotenv/config'
import express from 'express'
import { createPublicClient, createWalletClient, http, publicActions } from 'viem'
import { arcTestnet } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { verify, settle } from 'x402/facilitator'

const serverKey = process.env.SERVER_PRIVATE_KEY as `0x${string}`
if (!serverKey) {
  console.error('SERVER_PRIVATE_KEY not set')
  process.exit(1)
}

const account = privateKeyToAccount(serverKey)
const publicClient = createPublicClient({ chain: arcTestnet, transport: http('https://rpc.testnet.arc.network') })
const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http('https://rpc.testnet.arc.network') }).extend(publicActions)

const app = express()
app.use(express.json())

app.get('/supported', (_req, res) => {
  res.json({
    kinds: [{ x402Version: 1, scheme: 'exact', network: 'arc-testnet' }]
  })
})

app.post('/verify', async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body
    console.log('[FACILITATOR] verify called, network:', paymentRequirements?.network, 'payload.network:', paymentPayload?.network)
    const result = await verify(publicClient as any, paymentPayload, paymentRequirements)
    console.log('[FACILITATOR] verify result:', JSON.stringify(result))
    res.json(result)
  } catch (err: any) {
    console.error('[FACILITATOR] verify threw:', err.message)
    res.status(400).json({ isValid: false, invalidReason: err.message })
  }
})

app.post('/settle', async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body
    console.log('[FACILITATOR] settle called, network:', paymentRequirements?.network)
    const result = await settle(walletClient as any, paymentPayload, paymentRequirements)
    console.log('[FACILITATOR] settle result:', JSON.stringify(result))
    res.json(result)
  } catch (err: any) {
    console.error('[FACILITATOR] settle threw:', err.message)
    res.status(400).json({ success: false, errorReason: err.message })
  }
})

app.listen(4022, () => {
  console.log('Facilitator on http://localhost:4022 (Arc testnet)')
  console.log('Settler wallet:', account.address)
})
