import { getValidMovesForPiece } from './chessLogic';

// Define reasonable boundaries for the "infinite" board
const MAX_COORD = 1000000;
const MIN_COORD = -1000000;

/**
 * Attempts to perform a single random move for one piece.
 * @param {object} currentData The current state { pieces, walls }
 * @returns {object} The next state { pieces, walls } after a move, or the original state if no move was made.
 */
export function performSingleRandomMove(currentData) {
    // Check if currentData and pieces exist
    if (!currentData || !currentData.pieces || currentData.pieces.length === 0) {
        return currentData; // No pieces to move
    }

    const pieces = currentData.pieces;
    const walls = currentData.walls;
    const numPieces = pieces.length;

    // Try to find a piece that can move (basic attempt, might need improvement)
    // We try a few random pieces before giving up for this step
    let moved = false;
    let nextPieces = pieces;
    let attempts = 0;
    const maxAttempts = Math.min(numPieces, 5); // Try up to 5 pieces or numPieces

    while (!moved && attempts < maxAttempts) {
        const idx = Math.floor(Math.random() * numPieces);
        const piece = pieces[idx];
        const validMoves = getValidMovesForPiece(piece, pieces, walls);

        if (validMoves.length > 0) {
            // Pick a random valid move
            const move = validMoves[Math.floor(Math.random() * validMoves.length)];
            let { row: targetRow, col: targetCol } = move; // Use let
            
            // Check for captures using the potentially clamped coordinates
            const capturedPieceIndex = pieces.findIndex(
                p => p.row === targetRow && p.col === targetCol
            );
            
            // Update the piece list using clamped coordinates
            nextPieces = pieces
                .map((p, i) => (i === idx ? { ...p, row: targetRow, col: targetCol } : p))
                .filter((p, i) => i !== capturedPieceIndex);

            moved = true;
        } else {
            // This piece has no valid moves, try another one
            attempts++;
        }
    }

    // Only return updated state if a move was actually made
    if (moved) {
        return { ...currentData, pieces: nextPieces };
    } else {
        // Return the original state if no move was found
        // console.log("No valid moves found for randomly selected pieces, attempt:", attempts);
        return currentData; 
    }
} 