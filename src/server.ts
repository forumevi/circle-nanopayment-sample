import 'dotenv/config'
import express from 'express'
import { paymentMiddlewareFromConfig, type x402ResourceServer } from '@x402/express'
import { BatchFacilitatorClient, GatewayEvmScheme } from '@circle-fin/x402-batching/server'

type FacilitatorClient = Parameters<typeof paymentMiddlewareFromConfig>[1]

const serverAddress = process.env.SERVER_ADDRESS as string
if (!serverAddress) {
  console.error('SERVER_ADDRESS not set in .env')
  process.exit(1)
}

const app = express()

// Circle Gateway facilitator — handles verification & settlement via nanopayments
const batchFacilitator = new BatchFacilitatorClient()

// Route config: v2 format with PaymentOption
const routes = {
  'GET /risk-profile': {
    accepts: {
      scheme: 'exact',
      network: 'eip155:5042002' as const, // Arc Testnet
      payTo: serverAddress,
      price: '$0.01',
    },
  },
}

app.use(
  paymentMiddlewareFromConfig(
    routes,
    batchFacilitator as unknown as FacilitatorClient,
    [{ network: 'eip155:5042002', server: new GatewayEvmScheme() }],
  )
)

app.get('/risk-profile', (_req, res) => {
  res.json({ risk_score: 87, risk_level: 'high', recommendation: 'block_transaction' })
})

app.listen(4021, () => {
  console.log('Server on http://localhost:4021')
  console.log('Paywall: GET /risk-profile → $0.01 USDC nanopayment (Circle Gateway)')
  console.log(`Seller address: ${serverAddress}`)
})
