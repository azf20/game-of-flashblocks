import { useEffect, useState, useCallback } from 'react'

interface GameOfLifeProps {
  gridSize: number;
  cellSize: number;
  tickCount: number;
  label: string;
  resetKey: number;
  pattern: "random" | "pulsar" | "pentadecathlon" | "gliderGun";
  highlight?: boolean;
  highlightColor?: string;
  baseColor?: string;
}

// Simple seeded random number generator
function seededRandom(seed: number) {
  return function () {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// Generate a random grid
function generateRandomGrid(size: number, seed: number): boolean[][] {
  const grid = Array(size)
    .fill(null)
    .map(() => Array(size).fill(false));
  const random = seededRandom(seed);

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      grid[i][j] = random() < 0.25;
    }
  }
  return grid;
}

// Generate a grid with a specific pattern
function generatePatternGrid(
  size: number,
  pattern: "pulsar" | "pentadecathlon" | "gliderGun"
): boolean[][] {
  const grid = Array(size)
    .fill(null)
    .map(() => Array(size).fill(false));

  // Position patterns near the center
  const center = Math.floor(size / 2);

  switch (pattern) {
    case "pulsar": {
      // Pulsar - period 3 oscillator
      const points = [
        // Top
        [-2, 1],
        [-2, 2],
        [-2, 3],
        [-1, 6],
        [0, 6],
        [1, 6],
        [1, 3],
        [1, 2],
        [1, 1],
        [-1, -6],
        [0, -6],
        [1, -6],
        [-2, -3],
        [-2, -2],
        [-2, -1],
        [1, -3],
        [1, -2],
        [1, -1],
        // Bottom (mirror of top)
        [2, 1],
        [2, 2],
        [2, 3],
        [6, 1],
        [6, 0],
        [6, -1],
        [-1, 3],
        [-1, 2],
        [-1, 1],
        [6, -1],
        [6, 0],
        [6, 1],
        [2, -3],
        [2, -2],
        [2, -1],
        [-1, -3],
        [-1, -2],
        [-1, -1],
      ];
      points.forEach(([y, x]) => {
        const row = center + y;
        const col = center + x;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          grid[row][col] = true;
        }
      });
      break;
    }
    case "pentadecathlon": {
      // Pentadecathlon - period 15 oscillator
      const points = [
        [-4, 0],
        [-3, 0],
        [-2, 0],
        [-1, 0],
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
        [-5, 0],
        [-5, -1],
        [-5, 1],
        [4, 0],
        [4, -1],
        [4, 1],
      ];
      points.forEach(([y, x]) => {
        const row = center + y;
        const col = center + x;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          grid[row][col] = true;
        }
      });
      break;
    }
    case "gliderGun": {
      // Gosper glider gun - continuously creates gliders
      const points = [
        [0, 2],
        [0, 3],
        [1, 2],
        [1, 3], // Left block
        [8, 3],
        [8, 4],
        [9, 2],
        [9, 4],
        [10, 2],
        [10, 3], // Left ship
        [16, 4],
        [16, 5],
        [16, 6],
        [17, 4],
        [18, 5], // Right ship
        [22, 1],
        [22, 2],
        [23, 0],
        [23, 2],
        [24, 0],
        [24, 1], // Right block
        [34, 2],
        [34, 3],
        [35, 2],
        [35, 3], // Far right block
      ];
      points.forEach(([y, x]) => {
        const row = center - 10 + y;
        const col = center - 18 + x;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          grid[row][col] = true;
        }
      });
      break;
    }
  }

  return grid;
}

const colorMap = {
  emerald: {
    bg: "bg-emerald-500",
    bgHighlight: "bg-emerald-900/50",
    ring: "ring-emerald-500",
    text: "text-emerald-400",
  },
  blue: {
    bg: "bg-blue-500",
    bgHighlight: "bg-blue-900/50",
    ring: "ring-blue-500",
    text: "text-blue-400",
  },
  purple: {
    bg: "bg-purple-500",
    bgHighlight: "bg-purple-900/50",
    ring: "ring-purple-500",
    text: "text-purple-400",
  },
  yellow: {
    bg: "bg-yellow-500",
    bgHighlight: "bg-yellow-900/50",
    ring: "ring-yellow-500",
    text: "text-yellow-400",
  },
  orange: {
    bg: "bg-orange-500",
    bgHighlight: "bg-orange-900/50",
    ring: "ring-orange-500",
    text: "text-orange-400",
  },
  pink: {
    bg: "bg-pink-500",
    bgHighlight: "bg-pink-900/50",
    ring: "ring-pink-500",
    text: "text-pink-400",
  },
  indigo: {
    bg: "bg-indigo-500",
    bgHighlight: "bg-indigo-900/50",
    ring: "ring-indigo-500",
    text: "text-indigo-400",
  },
  cyan: {
    bg: "bg-cyan-500",
    bgHighlight: "bg-cyan-900/50",
    ring: "ring-cyan-500",
    text: "text-cyan-400",
  },
};

export function GameOfLife({
  gridSize,
  cellSize,
  tickCount,
  label,
  resetKey,
  pattern,
  highlight = false,
  highlightColor = "emerald",
  baseColor = "emerald",
}: GameOfLifeProps) {
  const generateInitialGrid = useCallback(() => {
    if (pattern === "random") {
      const boundedSeed = (resetKey % 1000) + 1;
      return generateRandomGrid(gridSize, boundedSeed);
    }
    return generatePatternGrid(gridSize, pattern);
  }, [gridSize, resetKey, pattern]);

  const [grid, setGrid] = useState<boolean[][]>(() => generateInitialGrid());

  // Reset grid when resetKey changes
  useEffect(() => {
    setGrid(generateInitialGrid());
  }, [resetKey, generateInitialGrid]);

  const computeNextGeneration = useCallback(
    (currentGrid: boolean[][]) => {
      const nextGrid = currentGrid.map((row, i) =>
        row.map((cell, j) => {
          let neighbors = 0;
          // Check all 8 neighbors
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              if (di === 0 && dj === 0) continue;
              const ni = (i + di + gridSize) % gridSize;
              const nj = (j + dj + gridSize) % gridSize;
              if (currentGrid[ni][nj]) neighbors++;
            }
          }

          // Apply Conway's Game of Life rules
          if (cell) {
            return neighbors === 2 || neighbors === 3;
          } else {
            return neighbors === 3;
          }
        })
      );
      return nextGrid;
    },
    [gridSize]
  );

  useEffect(() => {
    setGrid((prevGrid) => computeNextGeneration(prevGrid));
  }, [tickCount, computeNextGeneration]);

  return (
    <div
      className={`relative p-4 bg-gray-900 rounded-lg transition-colors ${
        highlight
          ? `${colorMap[highlightColor as keyof typeof colorMap].bgHighlight} ${colorMap[highlightColor as keyof typeof colorMap].ring}`
          : `${colorMap[baseColor as keyof typeof colorMap].bgHighlight} ${colorMap[baseColor as keyof typeof colorMap].ring}`
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <div
          className={`text-sm font-mono ${
            highlight
              ? colorMap[highlightColor as keyof typeof colorMap].text
              : "text-gray-400"
          }`}
        >
          {label}
        </div>
        <div
          className={`text-sm font-mono ${
            highlight
              ? colorMap[highlightColor as keyof typeof colorMap].text
              : "text-gray-400"
          }`}
        >
          Gen {tickCount}
        </div>
      </div>
      <div className="flex justify-center">
        <div
          className="grid gap-px bg-gray-800"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
          }}
        >
          {grid.map((row, i) =>
            row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                }}
                className={`transition-colors ${
                  cell
                    ? highlight
                      ? colorMap[highlightColor as keyof typeof colorMap].bg
                      : colorMap[baseColor as keyof typeof colorMap].bg
                    : "bg-gray-900"
                }`}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
} 