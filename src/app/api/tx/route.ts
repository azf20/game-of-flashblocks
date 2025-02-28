import { createWalletClient, http, stringToHex } from 'viem'
import { mnemonicToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

if (!process.env.MNEMONIC) {
  throw new Error('MNEMONIC environment variable is not set')
}

// Create wallet client
const client = createWalletClient({
  chain: baseSepolia,
  transport: http()
})

// Create account from mnemonic in environment variable
const account = mnemonicToAccount(process.env.MNEMONIC)

export async function POST() {
  try {
    console.log(`Making a transaction from ${account.address}`)
    const hash = await client.sendTransaction({
      account,
      to: '0x0000000000000000000000000000000000000000',
      data: stringToHex('flashblocks'),
    })
    console.log(`Transaction sent: ${hash}`)
    return Response.json({ hash })
  } catch (error) {
    console.error('Transaction error:', error)
    return Response.json({ error: 'Failed to send transaction' }, { status: 500 })
  }
} 