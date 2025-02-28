import { http, cookieStorage, createConfig, createStorage } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, injected } from 'wagmi/connectors'

export function getConfig() {
  return createConfig({
    chains: [baseSepolia],
    connectors: [injected(), coinbaseWallet()],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [baseSepolia.id]: http('https://sepolia-preconf.base.org'),
    },
  })
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}
