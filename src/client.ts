import 'dotenv/config'
import { createWalletClient, http } from 'viem'
import { arcTestnet } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { createPaymentHeader, selectPaymentRequirements } from 'x402/client'

const privateKey = process.env.CLIENT_PRIVATE_KEY as `0x${string}`
if (!privateKey) { console.error('CLIENT_PRIVATE_KEY not set'); process.exit(1) }

const account = privateKeyToAccount(privateKey)
const wallet = createWalletClient({ account, chain: arcTestnet, transport: http('https://rpc.testnet.arc.network') })

const URL = 'http://localhost:4021/risk-profile'
console.log(`Wallet: ${account.address}`)
console.log(`Calling ${URL} ...\n`)

// Step 1: initial request — expect 402
const res1 = await fetch(URL)
if (res1.status !== 402) {
  console.log('Unexpected status:', res1.status, await res1.text())
  process.exit(1)
}

const body = await res1.json() as { accepts: any[] }
console.log('Got 402. Payment required:', JSON.stringify(body.accepts?.[0], null, 2), '\n')

// Step 2: select payment requirements and sign
const paymentReqs = selectPaymentRequirements(body.accepts, 'arc-testnet', '10000')
const paymentHeader = await createPaymentHeader(wallet as any, 1, paymentReqs)
const decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString())
console.log('Payment payload network:', decoded.network)
console.log('Payment signed. Retrying with X-PAYMENT header...\n')

// Step 3: retry with payment
const res2 = await fetch(URL, { headers: { 'X-PAYMENT': paymentHeader } })
const data = await res2.json()

if (res2.status === 200) {
  console.log('✅ Payment complete! Response:')
  console.log(JSON.stringify(data, null, 2))
} else {
  console.log('❌ Payment failed:', res2.status, JSON.stringify(data, null, 2))
}
