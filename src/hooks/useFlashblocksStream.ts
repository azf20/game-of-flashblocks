import { useState, useEffect, useCallback } from 'react'

interface FlashBlock {
  payload_id: string
  index: number
  base?: {
    parent_hash: string
    fee_recipient: string
    block_number: string
    gas_limit: string
    timestamp: string
    base_fee_per_gas: string
  }
  diff: {
    state_root: string
    block_hash: string
    gas_used: string
    transactions: string[]
    withdrawals: any[]
  }
  metadata: {
    block_number: number
    new_account_balances: Record<string, string>
    receipts: Record<string, any>
  }
}

export function useFlashblocksStream() {
  const [blocks, setBlocks] = useState<FlashBlock[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receiptLocations, setReceiptLocations] = useState<Record<string, { blockNumber: number, index: number }>>({})

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket('wss://sepolia.flashblocks.base.org/ws')

      ws.onopen = () => {
        console.log('Connected to Flashblocks WebSocket')
        setIsConnected(true)
        setError(null)
      }

      ws.onmessage = async (event) => {
        try {
          let data: string
          if (event.data instanceof Blob) {
            data = await event.data.text()
          } else {
            data = event.data
          }
          
          const block = JSON.parse(data)
          const blockId = `${block.metadata.block_number}_${block.index}`
          
          // Update receipt locations
          const receipts = block.metadata.receipts || {}
          const newLocations = Object.keys(receipts).reduce((acc, receiptId) => ({
            ...acc,
            [receiptId]: {
              blockNumber: block.metadata.block_number,
              index: block.index
            }
          }), {})
          
          setReceiptLocations(prev => ({
            ...prev,
            ...newLocations
          }))
          
          setBlocks((prevBlocks) => {
            // Keep only the last 50 flashblocks
            const newBlocks = [block, ...prevBlocks].slice(0, 50)
            return newBlocks
          })
        } catch (e) {
          console.error('Error parsing message:', e)
          console.error('Raw data:', event.data)
        }
      }

      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        setError('WebSocket connection error')
        setIsConnected(false)
      }

      ws.onclose = () => {
        console.log('WebSocket connection closed')
        setIsConnected(false)
      }

      return () => {
        ws.close()
      }
    } catch (e) {
      setError('Failed to connect to WebSocket')
      console.error('Connection error:', e)
    }
  }, [])

  useEffect(() => {
    const cleanup = connect()
    return () => {
      cleanup?.()
    }
  }, [connect])

  // Clean up old receipt locations
  const cleanupReceiptLocations = useCallback((currentBlockNumber: number, locations: Record<string, { blockNumber: number, index: number }>) => {
    // Keep receipts from the last 20 blocks
    const minBlockToKeep = currentBlockNumber - 20
    return Object.entries(locations).reduce((acc, [hash, location]) => {
      if (location.blockNumber >= minBlockToKeep) {
        acc[hash] = location
      }
      return acc
    }, {} as Record<string, { blockNumber: number, index: number }>)
  }, [])

  return {
    blocks,
    isConnected,
    error,
    reconnect: connect,
    receiptLocations
  }
} 