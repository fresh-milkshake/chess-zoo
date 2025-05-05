/**
 * Performs a Breadth-First Search (BFS) to find the shortest path on a grid.
 * 
 * @param {{row: number, col: number}} start The starting cell.
 * @param {{row: number, col: number}} end The target cell.
 * @param {Array<object>} walls Array of wall objects {row, col}.
 * @param {Array<object>} pieces Array of piece objects {row, col}.
 * @param {Array<import('./visitorTypes').Visitor>} visitors Array of visitor objects {row, col}.
 * @returns {Array<{row: number, col: number}> | null} An array of cells representing the path (excluding start, including end), or null if no path exists.
 */
export function findPath(start, end, walls, pieces, visitors) {
    const queue = [[start, []]]; // [[cell, path_to_cell], ...]
    const visited = new Set([`${start.row},${start.col}`]);

    // Limit search space to prevent hangs on large boards/complex situations
    const MAX_NODES_TO_VISIT = 5000; 
    let nodesVisited = 0;

    // Pre-build obstacle set for faster lookups
    const obstacles = new Set();
    walls.forEach(w => obstacles.add(`${w.row},${w.col}`));
    pieces.forEach(p => obstacles.add(`${p.row},${p.col}`));
    visitors.forEach(v => obstacles.add(`${v.row},${v.col}`)); // Treat all visitors as obstacles

    const directions = [
        { dr: -1, dc: 0 }, // Up
        { dr: 1, dc: 0 },  // Down
        { dr: 0, dc: -1 }, // Left
        { dr: 0, dc: 1 },  // Right
        // Optional: Add diagonals if needed
        // { dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 },
    ];

    while (queue.length > 0) {
        nodesVisited++;
        if (nodesVisited > MAX_NODES_TO_VISIT) {
            console.warn("BFS limit reached, pathfinding aborted.");
            return null; // Prevent infinite loop / hang
        }

        const [currentCell, path] = queue.shift();

        // Check if we reached the end
        if (currentCell.row === end.row && currentCell.col === end.col) {
            return path; // Return the path (which doesn't include the start cell)
        }

        // Explore neighbors
        for (const { dr, dc } of directions) {
            const nextRow = currentCell.row + dr;
            const nextCol = currentCell.col + dc;
            const nextCellKey = `${nextRow},${nextCol}`;

            // Check if the neighbor is valid and not visited/blocked
            // Note: We allow pathing *into* the end cell even if occupied by the target piece itself (handled later)
            // but not through other obstacles.
            const isEndCell = nextRow === end.row && nextCol === end.col;
            if (!visited.has(nextCellKey) && (isEndCell || !obstacles.has(nextCellKey))) {
                visited.add(nextCellKey);
                const newPath = [...path, { row: nextRow, col: nextCol }];
                queue.push([{ row: nextRow, col: nextCol }, newPath]);
            }
        }
    }

    return null; // No path found
} 