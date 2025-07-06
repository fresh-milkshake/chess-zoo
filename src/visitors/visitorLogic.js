import { VisitorState, VISITOR_SPEED, VIEWING_DISTANCE, TARGETING_RANGE, MIN_STATE_DURATION, MAX_STATE_DURATION, COMMENT_DURATION } from './visitorConstants';
import { getPieceAt, isWallAt } from '../logic/chessLogic';
import { v4 as uuidv4 } from 'uuid';
import { findPath } from './pathfinding';

/**
 * Creates a new visitor with randomized appearance and initial state.
 * @param {number} initialRow 
 * @param {number} initialCol 
 * @returns {import('./visitorTypes').Visitor}
 */
export function createRandomVisitor(initialRow, initialCol) {
    const color = '#000000';
    const isChild = Math.random() < 0.20;
    const baseHead = isChild ? 0.12 : 0.15;
    const randHead = isChild ? 0.06 : 0.02;
    const baseBody = isChild ? 0.3 : 0.4;
    const randBody = isChild ? 0.15 : 0.2;
    const baseLeg = isChild ? 0.2 : 0.3;
    const randLeg = isChild ? 0.1 : 0.15;
    const baseArm = isChild ? 0.18 : 0.25;
    const randArm = isChild ? 0.08 : 0.1;

    return {
        id: uuidv4(),
        row: initialRow, 
        col: initialCol, 
        state: VisitorState.IDLE,
        targetPieceId: null,
        movementTarget: null,
        appearance: {
            color: color,
            headRadius: baseHead + Math.random() * randHead, 
            bodyLength: baseBody + Math.random() * randBody,
            legLength: baseLeg + Math.random() * randLeg,
            armLength: baseArm + Math.random() * randArm,
        },
        isChild: isChild,
        currentComment: null,
        stateTimer: Date.now() + Math.random() * 1000,
        commentTimer: null,
        currentPath: null
    };
}

/**
 * Generates a random comment about a piece.
 * @param {string} pieceType Upper case piece type (e.g., 'N', 'Q')
 * @returns {string} A random comment.
 */
function generateComment(pieceType) {
    const comments = {
        'P': ["Look, a pawn!", "So many pawns.", "A humble pawn.", "Marching forward!", "One step at a time.", "The brave little pawn.", "Pawn power!", "The foundation piece."],
        'N': ["A knight!", "Graceful jump!", "Cool horse piece!", "L-shape moves.", "Leaping over others!", "The tricky knight.", "What an interesting path!", "A noble steed."],
        'B': ["The bishop.", "Moving diagonally.", "Nice bishop!", "Looks pointy.", "Sliding across colors.", "The strategic bishop.", "Long range striker.", "Diagonal master."],
        'R': ["It's a rook!", "Straight lines only.", "Like a castle.", "Powerful rook!", "Standing tall!", "The mighty fortress.", "Guarding the ranks.", "Such straight moves!"],
        'Q': ["The Queen!", "Wow, the Queen!", "Most powerful piece!", "Look at her go!", "So majestic!", "The mighty queen.", "Ruler of the board!", "What amazing moves!"],
        'K': ["The King!", "Protect the King!", "Regal looking.", "Slow and steady.", "The royal piece!", "Most important piece.", "Lead your army!", "The noble king."]
    };
    const typeComments = comments[pieceType.toUpperCase()] || ["Interesting piece...", "What is that?", "Look!"];
    return typeComments[Math.floor(Math.random() * typeComments.length)];
}

/**
 * Finds the piece object by its ID.
 * @param {string} pieceId 
 * @param {Array<object>} allPieces 
 * @returns {object | null}
 */
function findPieceById(pieceId, allPieces) {
    return allPieces.find(p => p.id === pieceId) || null;
}

/**
 * Check if a specific *grid cell* is occupied by a wall, piece, or another visitor.
 * @param {number} row 
 * @param {number} col 
 * @param {Array<object>} walls 
 * @param {Array<object>} pieces 
 * @param {Array<import('./visitorTypes').Visitor>} visitors 
 * @param {string | null} selfId - The ID of the visitor performing the check, to exclude self.
 * @returns {boolean} True if occupied, false otherwise.
 */
function isOccupied(row, col, walls, pieces, visitors, selfId = null) {
    if (isWallAt(row, col, walls) || getPieceAt(row, col, pieces)) {
        return true;
    }
    return visitors.some(v => v.id !== selfId && v.row === row && v.col === col);
}

/**
 * Finds potential viewing spots around a target piece, avoiding adjacent cells.
 * @param {{row: number, col: number}} targetPiecePos 
 * @param {number} radius Search radius around the piece.
 * @param {Array<object>} walls 
 * @param {Array<object>} pieces 
 * @param {Array<import('./visitorTypes').Visitor>} visitors 
 * @returns {Array<{row: number, col: number}>} Array of valid, non-adjacent empty cells.
 */
function findValidViewingSpots(targetPiecePos, radius, walls, pieces, visitors) {
    const validSpots = [];
    for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
            if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) continue; 

            const spotRow = targetPiecePos.row + dr;
            const spotCol = targetPiecePos.col + dc;

            if (!isOccupied(spotRow, spotCol, walls, pieces, visitors)) {
                validSpots.push({ row: spotRow, col: spotCol });
            }
        }
    }
    return validSpots;
}

/**
 * Main update function for a single visitor's state machine.
 * @param {import('./visitorTypes').Visitor} visitor 
 * @param {Array<object>} allPieces 
 * @param {Array<object>} walls 
 * @param {Array<import('./visitorTypes').Visitor>} allVisitors 
 * @returns {import('./visitorTypes').Visitor} The updated visitor object.
 */
export function updateVisitor(visitor, allPieces, walls, allVisitors) {
    const now = Date.now();
    let updatedVisitor = { ...visitor };

    if (updatedVisitor.commentTimer && now >= updatedVisitor.commentTimer) {
        updatedVisitor.currentComment = null;
        updatedVisitor.commentTimer = null;
        if (updatedVisitor.state === VisitorState.COMMENTING) {
             updatedVisitor.state = VisitorState.OBSERVING;
             updatedVisitor.stateTimer = now + MIN_STATE_DURATION + Math.random() * (MAX_STATE_DURATION - MIN_STATE_DURATION);
        }
    }

    if (updatedVisitor.state === VisitorState.MOVING_TO_TARGET) {
        if (!updatedVisitor.currentPath || updatedVisitor.currentPath.length === 0) {
            updatedVisitor.movementTarget = null;
            updatedVisitor.currentPath = null;
            updatedVisitor.state = VisitorState.OBSERVING;
            updatedVisitor.stateTimer = now + MIN_STATE_DURATION + Math.random() * (MAX_STATE_DURATION - MIN_STATE_DURATION);
        } else {
            const nextCell = updatedVisitor.currentPath[0];
            if (!isOccupied(nextCell.row, nextCell.col, walls, allPieces, allVisitors, updatedVisitor.id)) {
                updatedVisitor.row = nextCell.row;
                updatedVisitor.col = nextCell.col;
                updatedVisitor.currentPath.shift();
                if (updatedVisitor.currentPath.length === 0) {
                    updatedVisitor.movementTarget = null;
                    updatedVisitor.state = VisitorState.OBSERVING;
                    updatedVisitor.stateTimer = now + MIN_STATE_DURATION + Math.random() * (MAX_STATE_DURATION - MIN_STATE_DURATION);
                }
            } else {
                updatedVisitor.movementTarget = null;
                updatedVisitor.currentPath = null;
                updatedVisitor.state = VisitorState.IDLE;
                updatedVisitor.stateTimer = now + 2000 + Math.random() * 3000; 
            }
        }
        return updatedVisitor;
    } 
    else if (updatedVisitor.state === VisitorState.WANDERING) {
         if (!updatedVisitor.currentPath || updatedVisitor.currentPath.length === 0) {
            updatedVisitor.movementTarget = null;
            updatedVisitor.currentPath = null;
            updatedVisitor.state = VisitorState.IDLE;
            updatedVisitor.stateTimer = now + MIN_STATE_DURATION + Math.random() * (MAX_STATE_DURATION - MIN_STATE_DURATION);
        } else {
            const nextCell = updatedVisitor.currentPath[0];
            if (!isOccupied(nextCell.row, nextCell.col, walls, allPieces, allVisitors, updatedVisitor.id)) {
                updatedVisitor.row = nextCell.row;
                updatedVisitor.col = nextCell.col;
                updatedVisitor.currentPath.shift();
                if (updatedVisitor.currentPath.length === 0) {
                    updatedVisitor.movementTarget = null;
                    updatedVisitor.state = VisitorState.IDLE;
                    updatedVisitor.stateTimer = now + MIN_STATE_DURATION + Math.random() * (MAX_STATE_DURATION - MIN_STATE_DURATION);
                }
            } else {
                updatedVisitor.movementTarget = null;
                updatedVisitor.currentPath = null;
                updatedVisitor.state = VisitorState.IDLE;
                updatedVisitor.stateTimer = now + 2000 + Math.random() * 3000; 
            }
        }
        return updatedVisitor;
    }

    if (now < updatedVisitor.stateTimer) {
        return updatedVisitor;
    }

    switch (updatedVisitor.state) {
        case VisitorState.IDLE:
        case VisitorState.SELECTING_TARGET:
            const currentPos = { row: updatedVisitor.row, col: updatedVisitor.col };
            const nearbyPieces = allPieces.filter(p => 
                Math.hypot(p.col - currentPos.col, p.row - currentPos.row) < TARGETING_RANGE
            );

            if (nearbyPieces.length > 0) {
                const targetPiece = nearbyPieces[Math.floor(Math.random() * nearbyPieces.length)];
                updatedVisitor.targetPieceId = targetPiece.id;
                
                // Find potential viewing spots (radius 3, avoiding adjacent)
                const potentialSpots = findValidViewingSpots(targetPiece, 3, walls, allPieces, allVisitors);
                
                if (potentialSpots.length > 0) {
                    // Pick a random valid spot
                    const targetSpot = potentialSpots[Math.floor(Math.random() * potentialSpots.length)];
                    
                    // Find path to the spot
                    const path = findPath(currentPos, targetSpot, walls, allPieces, allVisitors);

                    if (path && path.length > 0) {
                        console.log(`Visitor ${updatedVisitor.id} found path to ${targetSpot.row},${targetSpot.col} for piece ${targetPiece.id}`);
                        updatedVisitor.movementTarget = targetSpot;
                        updatedVisitor.currentPath = path;
                        updatedVisitor.state = VisitorState.MOVING_TO_TARGET;
                        // No timer needed for movement state, it runs each step
                    } else {
                        console.log(`Visitor ${updatedVisitor.id} found NO path to spot ${targetSpot.row},${targetSpot.col}`);
                        // No path found, go back to idle or wander
                        updatedVisitor.state = VisitorState.IDLE; // Or WANDERING
                        updatedVisitor.stateTimer = now + 1500 + Math.random() * 2000; 
                    }
                } else {
                    console.log(`Visitor ${updatedVisitor.id} found NO valid viewing spots for piece ${targetPiece.id}`);
                    // No valid spots, go back to idle or wander
                    updatedVisitor.state = VisitorState.IDLE; // Or WANDERING
                    updatedVisitor.stateTimer = now + 1500 + Math.random() * 2000; 
                }
            } else {
                // No pieces nearby, decide to wander
                const wanderTarget = findRandomEmptyNeighbor(currentPos, walls, allPieces, allVisitors);
                if (wanderTarget) {
                    const path = findPath(currentPos, wanderTarget, walls, allPieces, allVisitors);
                     if (path && path.length > 0) {
                         updatedVisitor.movementTarget = wanderTarget;
                         updatedVisitor.currentPath = path;
                         updatedVisitor.state = VisitorState.WANDERING;
                     } else {
                          updatedVisitor.state = VisitorState.IDLE; // Can't even wander?
                          updatedVisitor.stateTimer = now + 1000 + Math.random() * 1000;
                     }
                } else {
                      updatedVisitor.state = VisitorState.IDLE; // Surrounded?
                      updatedVisitor.stateTimer = now + 1000 + Math.random() * 1000;
                }
            }
            break;

        // MOVING_TO_TARGET and WANDERING handled above, outside the timer check

        case VisitorState.OBSERVING:
            const targetPieceObs = updatedVisitor.targetPieceId ? findPieceById(updatedVisitor.targetPieceId, allPieces) : null;
            if (targetPieceObs) {
                const distToTarget = Math.hypot(targetPieceObs.col - updatedVisitor.col, targetPieceObs.row - updatedVisitor.row);
                // Check if piece moved too far (needs new spot) or just comment
                if (distToTarget > VIEWING_DISTANCE * 1.5) { 
                    console.log(`Visitor ${updatedVisitor.id} lost target piece ${updatedVisitor.targetPieceId}`);
                    updatedVisitor.state = VisitorState.IDLE; // Re-evaluate target and path
                    updatedVisitor.targetPieceId = null;
                    updatedVisitor.stateTimer = now + 500 + Math.random() * 1000;
                } else if (Math.random() < 0.3) {
                    updatedVisitor.currentComment = generateComment(targetPieceObs.type);
                    updatedVisitor.commentTimer = now + COMMENT_DURATION;
                    updatedVisitor.state = VisitorState.COMMENTING;
                    updatedVisitor.stateTimer = now + COMMENT_DURATION + 200; // Stay commenting until bubble disappears
                } else {
                    // Stay observing, reset timer
                    updatedVisitor.stateTimer = now + MIN_STATE_DURATION + Math.random() * (MAX_STATE_DURATION - MIN_STATE_DURATION);
                }
            } else {
                // Target piece disappeared
                console.log(`Visitor ${updatedVisitor.id} target piece ${updatedVisitor.targetPieceId} disappeared`);
                updatedVisitor.state = VisitorState.IDLE;
                updatedVisitor.targetPieceId = null;
                updatedVisitor.stateTimer = now + 500 + Math.random() * 1000;
            }
            break;

        case VisitorState.COMMENTING:
            // Timer expiration handles transition back to OBSERVING (or IDLE if target lost)
            // If we are here, it means the comment timer expired exactly now.
            updatedVisitor.state = VisitorState.OBSERVING; 
            updatedVisitor.currentComment = null;
            updatedVisitor.commentTimer = null;
            updatedVisitor.stateTimer = now + MIN_STATE_DURATION + Math.random() * (MAX_STATE_DURATION - MIN_STATE_DURATION);
            break;
            
        default:
            updatedVisitor.state = VisitorState.IDLE;
            updatedVisitor.stateTimer = now + 1000;
    }

    return updatedVisitor;
}

/** Helper function for wandering */
function findRandomEmptyNeighbor(pos, walls, pieces, visitors) {
     const directions = [
        { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
        { dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 },
    ];
    const emptyNeighbors = [];
    for (const {dr, dc} of directions) {
        const nextRow = pos.row + dr;
        const nextCol = pos.col + dc;
        if (!isOccupied(nextRow, nextCol, walls, pieces, visitors)) {
            emptyNeighbors.push({ row: nextRow, col: nextCol });
        }
    }
    if (emptyNeighbors.length === 0) return null;
    return emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
} 