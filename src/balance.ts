import 'dotenv/config'
import { GatewayClient } from '@circle-fin/x402-batching/client'

const privateKey = process.env.SERVER_PRIVATE_KEY as `0x${string}`
if (!privateKey) { console.error('SERVER_PRIVATE_KEY not set'); process.exit(1) }

const gateway = new GatewayClient({
  chain: 'arcTestnet',
  privateKey,
})

console.log(`Seller address: ${gateway.address}\n`)

const balances = await gateway.getBalances()
console.log('Wallet USDC:', balances.wallet.formatted)
console.log('Gateway total:', balances.gateway.formattedTotal)
console.log('Gateway available:', balances.gateway.formattedAvailable)
console.log('Gateway withdrawing:', balances.gateway.formattedWithdrawing)
console.log('Gateway withdrawable:', balances.gateway.formattedWithdrawable)

// Withdraw if amount passed as CLI arg
const withdrawAmount = process.argv[2]
if (withdrawAmount) {
  console.log(`\nWithdrawing ${withdrawAmount} USDC...`)
  const result = await gateway.withdraw(withdrawAmount)
  console.log('✅ Withdrawal complete!')
  console.log(`Amount: ${result.formattedAmount} USDC`)
  console.log(`Tx: ${result.mintTxHash}`)
  console.log(`From: ${result.sourceChain} → ${result.destinationChain}`)
}
