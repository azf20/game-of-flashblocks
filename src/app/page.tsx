'use client'

import { useFlashblocksStream } from '../hooks/useFlashblocksStream'
import { GameOfLife } from '../components/GameOfLife'
import { BlockInfo } from '../components/BlockInfo'
import { useState, useEffect, useMemo } from 'react'
import * as Ariakit from "@ariakit/react"
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

function App() {
  const { blocks, receiptLocations, isConnected, reconnect } =
    useFlashblocksStream();

  // Track block numbers and flashblock counts
  const [blockTicks, setBlockTicks] = useState(0);
  const [flashblockTicks, setFlashblockTicks] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [pattern, setPattern] = useState<
    "random" | "pentadecathlon" | "gliderGun"
  >("random");
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [txColor, setTxColor] = useState<string>("emerald");
  const [colorIndex, setColorIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Available highlight colors (avoiding red which might indicate errors)
  const highlightColors = [
    "emerald", // keep green as an option
    "purple",
    "yellow",
    "blue",
    "orange",
    "pink",
    "indigo",
    "cyan",
  ];

  // Get color at specific index
  const getColor = (index: number) => {
    // Special case: if we're getting the base color (index = -1) for initial state (colorIndex = 0)
    if (index === -1 && colorIndex === 0) return "emerald";
    return highlightColors[
      ((index % highlightColors.length) + highlightColors.length) %
        highlightColors.length
    ];
  };

  // Get the next color in the sequence
  const getNextColor = () => {
    const nextIndex = colorIndex + 1;
    setColorIndex(nextIndex);
    return getColor(nextIndex);
  };

  // Get the current block from the latest flashblock
  const currentBlock = blocks[0]?.metadata.block_number || 0;

  // Get the last two complete blocks
  const completeBlocks = blocks
    .filter((block) => block.metadata.block_number < currentBlock)
    .reduce(
      (acc, block) => {
        const blockNum = block.metadata.block_number;
        if (!acc[blockNum]) {
          acc[blockNum] = [];
        }
        acc[blockNum].push(block);
        return acc;
      },
      {} as Record<number, typeof blocks>
    );

  // Get the last two block numbers
  const lastTwoBlockNumbers = Object.keys(completeBlocks)
    .map(Number)
    .sort((a, b) => b - a)
    .slice(0, 2);

  // Track the highest block we've seen to calculate relative generation
  const [highestSeenBlock, setHighestSeenBlock] = useState(0);

  // Calculate total transactions for the last two blocks
  const lastTwoBlocksTransactions = lastTwoBlockNumbers.map((blockNum) => ({
    blockNumber: blockNum,
    transactions: completeBlocks[blockNum].flatMap(
      (block) => block.diff.transactions
    ),
  }));

  // Check if our transaction is in any block
  const txLocation = useMemo(() => {
    if (!pendingTxHash) return null;

    const location = receiptLocations[pendingTxHash];

    if (location) {
      if (location.blockNumber === currentBlock) {
        return {
          type: "flashblock" as const,
          blockNumber: location.blockNumber,
          index: location.index,
        };
      } else {
        return {
          type: "block" as const,
          blockNumber: location.blockNumber,
        };
      }
    }

    return null;
  }, [pendingTxHash, receiptLocations, currentBlock]);

  // Update highest seen block and ticks when block number changes
  useEffect(() => {
    const highestBlock = lastTwoBlockNumbers[0];
    if (highestBlock > 0) {
      if (highestBlock > highestSeenBlock) {
        setHighestSeenBlock(highestBlock);
      }
      setBlockTicks((prev) =>
        highestBlock === highestSeenBlock ? prev : prev + 1
      );
    }
  }, [lastTwoBlockNumbers, highestSeenBlock]);

  // Update ticks when new flashblock arrives
  useEffect(() => {
    if (blocks.length > 0) {
      setFlashblockTicks((prev) => prev + 1);
    }
  }, [blocks]);

  // Get incomplete flashblocks (only from current block)
  const incompleteFlashblocks = blocks
    .filter((block) => block.metadata.block_number === currentBlock)
    .sort((a, b) => a.index - b.index) // Sort by index ascending
    .slice(0, 9)
    .map((block) => ({
      blockNumber: block.metadata.block_number,
      index: block.index,
      transactions: block.diff.transactions.length,
      highlight:
        txLocation?.type === "flashblock" &&
        txLocation.blockNumber === block.metadata.block_number &&
        txLocation.index === block.index,
    }));

  const handlePatternChange = (newPattern: typeof pattern) => {
    setPattern(newPattern);
    setBlockTicks(0);
    setFlashblockTicks(0);
    setResetKey((prev) => prev + 1);
  };

  const handleTransaction = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/tx", {
        method: "POST",
      });
      const data = await response.json();

      if (data.error) {
        console.error("Transaction failed:", data.error);
        return;
      }

      console.log("Transaction sent:", data.hash);
      setPendingTxHash(data.hash);
      setTxColor(getNextColor());
    } catch (error) {
      console.error("Failed to send transaction:", error);
      toast.error(<div className="text-sm">Failed to send transaction</div>, {
        position: "top-center",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-3xl mx-auto p-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400 font-mono flex items-center gap-2">
              <Ariakit.Button
                onClick={() => setDialogOpen(true)}
                className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors border border-gray-700 flex items-center gap-2"
              >
                <span>?</span>
              </Ariakit.Button>
              <Ariakit.Button
                onClick={() => {
                  setBlockTicks(0);
                  setFlashblockTicks(0);
                  setResetKey((prev) => prev + 1);
                }}
                className="h-[34px] px-3 py-1.5 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors border border-gray-700 flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </Ariakit.Button>
            </div>
            <div className="flex gap-2">
              <Ariakit.MenuProvider>
                <Ariakit.MenuButton className="px-3 py-1.5 bg-gray-800 text-sm text-gray-300 rounded hover:bg-gray-700 transition-colors border border-gray-700 flex items-center gap-2">
                  {pattern === "random"
                    ? "Random"
                    : pattern === "pentadecathlon"
                      ? "Pentadecathlon"
                      : "Glider Gun"}
                  <Ariakit.MenuButtonArrow />
                </Ariakit.MenuButton>
                <Ariakit.Menu
                  gutter={4}
                  className="bg-gray-800 border border-gray-700 rounded shadow-lg p-1 outline-none z-50"
                  style={{ zIndex: 50 }}
                >
                  <Ariakit.MenuItem
                    className="px-3 py-1.5 text-sm text-gray-300 rounded flex items-center gap-2 hover:bg-gray-700 cursor-pointer"
                    onClick={() => handlePatternChange("random")}
                  >
                    {pattern === "random" && <span>✓</span>}
                    <span className="flex-1">Random</span>
                  </Ariakit.MenuItem>
                  <Ariakit.MenuItem
                    className="px-3 py-1.5 text-sm text-gray-300 rounded flex items-center gap-2 hover:bg-gray-700 cursor-pointer"
                    onClick={() => handlePatternChange("pentadecathlon")}
                  >
                    {pattern === "pentadecathlon" && <span>✓</span>}
                    <span className="flex-1">Pentadecathlon</span>
                  </Ariakit.MenuItem>
                  <Ariakit.MenuItem
                    className="px-3 py-1.5 text-sm text-gray-300 rounded flex items-center gap-2 hover:bg-gray-700 cursor-pointer"
                    onClick={() => handlePatternChange("gliderGun")}
                  >
                    {pattern === "gliderGun" && <span>✓</span>}
                    <span className="flex-1">Glider Gun</span>
                  </Ariakit.MenuItem>
                </Ariakit.Menu>
              </Ariakit.MenuProvider>
              <Ariakit.Button
                onClick={handleTransaction}
                disabled={isLoading}
                className={`px-3 py-1.5 text-sm text-white rounded transition-colors flex items-center gap-2 ${
                  isLoading
                    ? "bg-blue-600/50 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Sending...</span>
                  </>
                ) : (
                  "New Color"
                )}
              </Ariakit.Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col justify-between h-[4.5rem]">
              {lastTwoBlockNumbers
                .slice()
                .reverse()
                .map((blockNumber) => {
                  const { transactions } = lastTwoBlocksTransactions.find(
                    (b) => b.blockNumber === blockNumber
                  )!;
                  return (
                    <BlockInfo
                      key={blockNumber}
                      type="block"
                      blockNumber={blockNumber}
                      transactions={transactions}
                      highlight={
                        txLocation?.type === "block" &&
                        txLocation.blockNumber === blockNumber
                      }
                      highlightColor={txColor}
                    />
                  );
                })}
            </div>
            <BlockInfo
              type="flashblock"
              blockNumber={currentBlock}
              flashblocks={incompleteFlashblocks}
              highlightColor={txColor}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GameOfLife
              gridSize={50}
              cellSize={5}
              tickCount={flashblockTicks}
              label="Flashblock game"
              resetKey={resetKey}
              pattern={pattern}
              highlight={
                txLocation?.type === "flashblock" ||
                txLocation?.type === "block"
              }
              highlightColor={txColor}
              baseColor={getColor(colorIndex - 1)}
            />

            <GameOfLife
              gridSize={50}
              cellSize={5}
              tickCount={blockTicks}
              label="Block game"
              resetKey={resetKey}
              pattern={pattern}
              highlight={txLocation?.type === "block"}
              highlightColor={txColor}
              baseColor={getColor(colorIndex - 1)}
            />
          </div>

          <Ariakit.Dialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-6 max-w-md w-full outline-none"
            backdrop={
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            }
          >
            <Ariakit.DialogHeading className="text-lg font-semibold text-white mb-4">
              Game of Flashblocks
            </Ariakit.DialogHeading>
            <div className="space-y-4 text-gray-300 text-sm">
              <p>
                Visualising the 10x speed of evolution of flashblocks vs.
                regular blocks, via Conway's Game Of Life.
              </p>
              <p>
                Initiate a transaction to change the colour of the board, and
                see how it more quickly it updates the Flashblocks game.
              </p>
              <div className="pt-2">
                <p className="font-medium text-white">Links:</p>
                <ul className="list-disc pl-4 space-y-1 mt-2">
                  <li>
                    <a
                      href="https://github.com/azf20/game-of-flashblocks"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      GitHub Repository
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://docs.base.org/buildathons/2025-02-flash/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Flashblocks Builder Side Quest
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://flashblocks.base.org/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Flashblocks Documentation
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Ariakit.DialogDismiss className="px-3 py-1.5 bg-gray-800 text-sm text-gray-300 rounded hover:bg-gray-700 transition-colors">
                Got it
              </Ariakit.DialogDismiss>
            </div>
          </Ariakit.Dialog>
        </div>
      </div>
      <Ariakit.Button
        onClick={isConnected ? undefined : reconnect}
        disabled={isConnected}
        className={`fixed bottom-4 right-4 h-8 px-2 rounded-full transition-colors border flex items-center gap-2 ${
          isConnected
            ? "bg-emerald-900/20 border-emerald-800 text-emerald-400 cursor-default"
            : "bg-red-900/20 border-red-800 text-red-400 hover:bg-red-900/40"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-emerald-400" : "bg-red-400"
          }`}
        />
        {!isConnected && <span className="text-sm">Reconnect</span>}
      </Ariakit.Button>
      <ToastContainer
        theme="dark"
        toastClassName="!bg-gray-800 !text-gray-200"
        position="top-center"
        limit={3}
        className="!text-sm"
      />
    </div>
  );
}

export default App
