import React from 'react'

interface FlashBlockInfo {
  blockNumber: number
  index: number
  transactions: number
  isLatest?: boolean
}

interface BlockInfoProps {
  type: 'block' | 'flashblock'
  blockNumber: number
  transactions?: string[]
  flashblocks?: Array<{
    blockNumber: number
    index: number
    transactions: number
    highlight?: boolean
  }>
  highlight?: boolean
  highlightColor?: string
}

const colorMap = {
  emerald: {
    bg: 'bg-emerald-500',
    bgHighlight: 'bg-emerald-900/50',
    ring: 'ring-2 ring-emerald-500',
    text: 'text-emerald-400'
  },
  blue: {
    bg: 'bg-blue-500',
    bgHighlight: 'bg-blue-900/50',
    ring: 'ring-2 ring-blue-500',
    text: 'text-blue-400'
  },
  purple: {
    bg: 'bg-purple-500',
    bgHighlight: 'bg-purple-900/50',
    ring: 'ring-2 ring-purple-500',
    text: 'text-purple-400'
  },
  yellow: {
    bg: 'bg-yellow-500',
    bgHighlight: 'bg-yellow-900/50',
    ring: 'ring-2 ring-yellow-500',
    text: 'text-yellow-400'
  },
  orange: {
    bg: 'bg-orange-500',
    bgHighlight: 'bg-orange-900/50',
    ring: 'ring-2 ring-orange-500',
    text: 'text-orange-400'
  },
  pink: {
    bg: 'bg-pink-500',
    bgHighlight: 'bg-pink-900/50',
    ring: 'ring-2 ring-pink-500',
    text: 'text-pink-400'
  },
  indigo: {
    bg: 'bg-indigo-500',
    bgHighlight: 'bg-indigo-900/50',
    ring: 'ring-2 ring-indigo-500',
    text: 'text-indigo-400'
  },
  cyan: {
    bg: 'bg-cyan-500',
    bgHighlight: 'bg-cyan-900/50',
    ring: 'ring-2 ring-cyan-500',
    text: 'text-cyan-400'
  }
}

export function BlockInfo({ type, blockNumber, transactions, flashblocks, highlight = false, highlightColor = 'emerald' }: BlockInfoProps) {
  const getHighlightClasses = (isHighlighted: boolean) => {
    if (!isHighlighted) return ''
    const color = colorMap[highlightColor as keyof typeof colorMap]
    return `${color.bgHighlight} ${color.ring} ${color.text}`
  }

  return (
    <div className={`bg-gray-900 p-2 rounded-lg transition-colors ${type === 'block' ? 'h-[2rem]' : 'h-[4.5rem]'} ${getHighlightClasses(highlight)}`}>
      {type === 'block' ? (
        <div className="flex justify-between items-center h-full">
          <div className={`text-sm font-mono ${highlight ? colorMap[highlightColor as keyof typeof colorMap].text : 'text-gray-400'}`}>#{blockNumber}</div>
          <div className={`text-sm font-mono ${highlight ? colorMap[highlightColor as keyof typeof colorMap].text : 'text-gray-400'}`}>{transactions?.length || 0}tx</div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center">
            <div className={`text-xs font-mono ${highlight ? colorMap[highlightColor as keyof typeof colorMap].text : 'text-gray-400'}`}>#{blockNumber}</div>
            <div className={`text-xs font-mono ${highlight ? colorMap[highlightColor as keyof typeof colorMap].text : 'text-gray-400'}`}>
              {flashblocks?.reduce((sum, block) => sum + block.transactions, 0)}tx
            </div>
          </div>
          <div className="grow grid grid-cols-5 gap-x-1 gap-y-0.5 content-start mt-1">
            {flashblocks?.map(({ index, transactions, highlight: isHighlighted }) => (
              <div 
                key={index}
                className={`px-1 py-0.5 rounded text-xs font-mono text-center transition-colors ${
                  isHighlighted 
                    ? `${colorMap[highlightColor as keyof typeof colorMap].bgHighlight} ${colorMap[highlightColor as keyof typeof colorMap].ring} ${colorMap[highlightColor as keyof typeof colorMap].text}`
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {index}<span className="hidden sm:inline"> {transactions}tx</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}