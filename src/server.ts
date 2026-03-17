import 'dotenv/config'
import express from 'express'
import { paymentMiddleware } from 'x402-express'

const serverAddress = process.env.SERVER_ADDRESS as `0x${string}`
if (!serverAddress) {
  console.error('SERVER_ADDRESS not set in .env')
  process.exit(1)
}

const app = express()

app.use(
  paymentMiddleware(
    serverAddress,
    { 'GET /risk-profile': { price: '$0.01', network: 'arc-testnet' } },
    { url: 'http://localhost:4022' }   // local facilitator
  )
)

app.get('/risk-profile', (_req, res) => {
  res.json({ risk_score: 87, risk_level: 'high', recommendation: 'block_transaction' })
})

app.listen(4021, () => {
  console.log('Server on http://localhost:4021')
  console.log('Paywall: GET /risk-profile → $0.01 USDC on Arc testnet')
})
