export const PIECE_TYPES = ['K', 'Q', 'R', 'B', 'N', 'P'];

// Define reasonable boundaries for the "infinite" board
const MAX_COORD = 1000000;
const MIN_COORD = -1000000;
const MAX_SLIDE_DISTANCE = 1000; // Limit sliding piece calculation distance

// Helper function to get the piece at a specific square
export function getPieceAt(row, col, pieces) {
  if (!pieces) return null;
  return pieces.find(p => p.row === row && p.col === col);
}

// Helper function to check if a square is blocked by a wall
export function isWallAt(row, col, walls) {
    if (!walls) return false;
    return walls.some(w => w.row === row && w.col === col);
}

/**
 * Calculates all valid moves for a given piece considering board boundaries,
 * walls, and other pieces.
 * @param {object} piece The piece to calculate moves for { row, col, type, color }
 * @param {array} allPieces Array of all pieces on the board
 * @param {array} walls Array of all walls on the board
 * @returns {array} Array of valid moves [{ row, col }, ...]
 */
export function getValidMovesForPiece(piece, allPieces, walls) {
  const validMoves = [];
  if (!piece) return validMoves;
  const { row: startRow, col: startCol, type, color } = piece;
  const pieceTypeUpper = type.toUpperCase();

  const isEnemy = (targetPiece) => targetPiece && targetPiece.color !== color;
  // const isFriend = (targetPiece) => targetPiece && targetPiece.color === color; // Not currently used, can be removed or kept

  // Helper to check if a move is within defined bounds
  const isInBounds = (r, c) => r >= MIN_COORD && r <= MAX_COORD && c >= MIN_COORD && c <= MAX_COORD;

  switch (pieceTypeUpper) {
    case 'P': // Pawn
      const direction = color === 'w' ? -1 : 1; // White moves up (-1), Black moves down (+1)
      const startRank = color === 'w' ? 6 : 1; // Assuming standard board orientation

      // 1. Forward 1 square
      const oneStepRow = startRow + direction;
      if (isInBounds(oneStepRow, startCol) && !getPieceAt(oneStepRow, startCol, allPieces) && !isWallAt(oneStepRow, startCol, walls)) {
        validMoves.push({ row: oneStepRow, col: startCol });

        // 2. Forward 2 squares (only from start rank)
        if (startRow === startRank) {
          const twoStepRow = startRow + 2 * direction;
          // Also check bounds for the two-step move
          if (isInBounds(twoStepRow, startCol) && !getPieceAt(twoStepRow, startCol, allPieces) && !isWallAt(twoStepRow, startCol, walls)) {
            validMoves.push({ row: twoStepRow, col: startCol });
          }
        }
      }

      // 3. Diagonal Captures
      const captureCols = [startCol - 1, startCol + 1];
      captureCols.forEach(capCol => {
        // Check bounds for capture square
        if (isInBounds(oneStepRow, capCol) && !isWallAt(oneStepRow, capCol, walls)) {
           const targetPiece = getPieceAt(oneStepRow, capCol, allPieces);
           if (targetPiece && isEnemy(targetPiece)) {
               validMoves.push({ row: oneStepRow, col: capCol });
           }
           // TODO: Add En Passant logic here if needed
        }
      });
      break;

    case 'N': // Knight
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      knightOffsets.forEach(([dRow, dCol]) => {
        const newRow = startRow + dRow;
        const newCol = startCol + dCol;
        // Check bounds before checking walls/pieces
        if (isInBounds(newRow, newCol) && !isWallAt(newRow, newCol, walls)) {
          const targetPiece = getPieceAt(newRow, newCol, allPieces);
          if (!targetPiece || isEnemy(targetPiece)) {
            validMoves.push({ row: newRow, col: newCol });
          }
        }
      });
      break;

    case 'K': // King
       const kingOffsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1], [1, 0], [1, 1],
      ];
      kingOffsets.forEach(([dRow, dCol]) => {
        const newRow = startRow + dRow;
        const newCol = startCol + dCol;
         // Check bounds before checking walls/pieces
         if (isInBounds(newRow, newCol) && !isWallAt(newRow, newCol, walls)) {
           const targetPiece = getPieceAt(newRow, newCol, allPieces);
           if (!targetPiece || isEnemy(targetPiece)) {
               validMoves.push({ row: newRow, col: newCol });
           }
           // TODO: Add Castling logic (requires checking if squares are attacked)
           // TODO: Add Check prevention logic
         }
      });
      break;

    case 'R': // Rook
    case 'B': // Bishop
    case 'Q': // Queen
      let directions = [];
      if (pieceTypeUpper === 'R') {
        directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Up, Down, Left, Right
      } else if (pieceTypeUpper === 'B') {
        directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]; // Diagonals
      } else { // Queen combines Rook and Bishop
        directions = [
          [-1, 0], [1, 0], [0, -1], [0, 1], // Rook moves
          [-1, -1], [-1, 1], [1, -1], [1, 1]  // Bishop moves
        ];
      }

      directions.forEach(([dRow, dCol]) => {
        // Add distance limit 'i <= MAX_SLIDE_DISTANCE' to prevent infinite loop
        for (let i = 1; i <= MAX_SLIDE_DISTANCE; i++) {
          const newRow = startRow + i * dRow;
          const newCol = startCol + i * dCol;

          // Check bounds first
          if (!isInBounds(newRow, newCol)) {
            break; // Stop if out of bounds
          }

          if (isWallAt(newRow, newCol, walls)) {
            break; // Stop if hit a wall
          }

          const targetPiece = getPieceAt(newRow, newCol, allPieces);
          if (targetPiece) {
            if (isEnemy(targetPiece)) {
              validMoves.push({ row: newRow, col: newCol }); // Can capture enemy
            }
            // Stop if we hit any piece (friend or foe)
            break;
          } else {
            validMoves.push({ row: newRow, col: newCol }); // Empty square, continue direction
          }
        }
      });
      break;
  }

  return validMoves;
} 