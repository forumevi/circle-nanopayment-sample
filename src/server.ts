import 'dotenv/config'
import express from 'express'
import { createGatewayMiddleware } from '@circle-fin/x402-batching/server'

const serverAddress = process.env.SERVER_ADDRESS as string
if (!serverAddress) {
  console.error('SERVER_ADDRESS not set in .env')
  process.exit(1)
}

const app = express()

const gateway = createGatewayMiddleware({ sellerAddress: serverAddress })

app.get('/risk-profile', gateway.require('$0.01'), (_req, res) => {
  res.json({ risk_score: 87, risk_level: 'high', recommendation: 'block_transaction' })
})

app.listen(4021, () => {
  console.log('Server on http://localhost:4021')
  console.log('Paywall: GET /risk-profile → $0.01 USDC nanopayment (Circle Gateway)')
  console.log(`Seller address: ${serverAddress}`)
})
