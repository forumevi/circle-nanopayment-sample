import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

const clientKey = generatePrivateKey()
const serverKey = generatePrivateKey()

console.log('\n=== Add to .env ===')
console.log(`CLIENT_PRIVATE_KEY=${clientKey}`)
console.log(`SERVER_PRIVATE_KEY=${serverKey}`)
console.log(`SERVER_ADDRESS=${privateKeyToAccount(serverKey).address}`)
console.log('\n=== Fund BOTH addresses with testnet USDC ===')
console.log(`Client address : ${privateKeyToAccount(clientKey).address}`)
console.log(`Server address : ${privateKeyToAccount(serverKey).address}`)
console.log('\nFaucet: https://faucet.circle.com  →  Arc Testnet + USDC\n')
