import { PIECE_IMAGES } from '../utils/assetLoader';
import {
    calculateBresenhamLine,
    calculateSquarePath, 
    calculateCirclePath 
} from '../logic/drawing';
// Import visitor type definition for JSDoc
import {} from '../visitors/visitorTypes'; 

// Board configuration constants (consider moving to a config file if shared elsewhere)
const LIGHT_COLOR = '#eee';
const DARK_COLOR = '#d2d2d2';
const WALL_COLOR = '#111';

function drawWall(ctx, x, y, size, wallSize, shape) {
    ctx.fillStyle = WALL_COLOR;
    const wallOffset = (size - wallSize) / 2;
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    if (shape === 'circle') {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = wallSize / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillRect(x + wallOffset, y + wallOffset, wallSize, wallSize);
    }
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function drawGrid(ctx, viewport, center, size, startRow, startCol, rows, cols, offsetX, offsetY) {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const row = startRow + r;
            const col = startCol + c;
            const x = Math.round(col * size + offsetX);
            const y = Math.round(row * size + offsetY);
            ctx.fillStyle = (row + col) % 2 === 0 ? LIGHT_COLOR : DARK_COLOR;
            ctx.fillRect(x, y, size, size);
        }
    }
}

function drawWalls(ctx, walls, size, offsetX, offsetY, viewport, wallSizePercentage, visibleBounds) {
    if (!walls || walls.length === 0) return;
    
    // Filter walls to only those potentially within the visible bounds
    const visibleWalls = walls.filter(wall => 
        wall.row >= visibleBounds.minRow && wall.row <= visibleBounds.maxRow &&
        wall.col >= visibleBounds.minCol && wall.col <= visibleBounds.maxCol
    );
    
    for (const wall of visibleWalls) {
        const x = Math.round(wall.col * size + offsetX);
        const y = Math.round(wall.row * size + offsetY);
        // Secondary check (optional but safe) to ensure it's within screen pixels
        if (x + size >= 0 && x <= viewport.width && y + size >= 0 && y <= viewport.height) {
            const adjustedWallSize = size * (wallSizePercentage / 100);
            drawWall(ctx, x, y, size, adjustedWallSize, wall.type || 'square');
        }
    }
}

function drawPieces(ctx, pieces, size, offsetX, offsetY, viewport, visibleBounds) {
    if (!pieces || pieces.length === 0) return;

    // Filter pieces to only those potentially within the visible bounds
    const visiblePieces = pieces.filter(piece => 
        piece.row >= visibleBounds.minRow && piece.row <= visibleBounds.maxRow &&
        piece.col >= visibleBounds.minCol && piece.col <= visibleBounds.maxCol
    );

    for (const piece of visiblePieces) {
        const x = Math.round(piece.col * size + offsetX);
        const y = Math.round(piece.row * size + offsetY);
        // Secondary check (optional but safe) ensures screen pixels & image exists
        if (x + size >= 0 && x <= viewport.width && y + size >= 0 && y <= viewport.height && PIECE_IMAGES[piece.type]) {
            const pieceSize = size * 0.9;
            const pieceOffset = (size - pieceSize) / 2;
            ctx.drawImage(PIECE_IMAGES[piece.type], x + pieceOffset, y + pieceOffset, pieceSize, pieceSize);
        }
    }
}

function drawShapePreview(ctx, walls, pieces, placementMode, drawingLine, hoverPosition, wallShape, size, offsetX, offsetY, viewport) {
    if (!(placementMode === 'wall' && drawingLine && hoverPosition)) return;

    let previewPath = [];
    if (wallShape === 'line') {
        previewPath = calculateBresenhamLine(drawingLine.startRow, drawingLine.startCol, hoverPosition.row, hoverPosition.col);
    } else if (wallShape === 'square') {
        previewPath = calculateSquarePath(drawingLine.startRow, drawingLine.startCol, hoverPosition.row, hoverPosition.col);
    } else if (wallShape === 'circle') {
        const deltaRow = hoverPosition.row - drawingLine.startRow;
        const deltaCol = hoverPosition.col - drawingLine.startCol;
        const radius = Math.sqrt(deltaRow * deltaRow + deltaCol * deltaCol);
        previewPath = calculateCirclePath(drawingLine.startRow, drawingLine.startCol, radius);
    }

    ctx.globalAlpha = 0.5;
    previewPath.forEach(point => {
        const x = Math.round(point.col * size + offsetX);
        const y = Math.round(point.row * size + offsetY);
        if (x + size >= 0 && x <= viewport.width && y + size >= 0 && y <= viewport.height) {
            const isOccupied = 
                (walls || []).some(w => w.row === point.row && w.col === point.col) ||
                (pieces || []).some(p => p.row === point.row && p.col === point.col);
            ctx.fillStyle = isOccupied ? '#ff0000' : '#555';
            ctx.fillRect(x + size * 0.3, y + size * 0.3, size * 0.4, size * 0.4);
        }
    });
    ctx.globalAlpha = 1.0;
}

function drawHoverIndicator(ctx, walls, pieces, placementMode, hoverPosition, wallShape, eraserShape, size, offsetX, offsetY, viewport, wallSizePercentage) {
    if (!placementMode || !hoverPosition || (placementMode === 'wall' && wallShape !== 'pen')) return;

    const x = Math.round(hoverPosition.col * size + offsetX);
    const y = Math.round(hoverPosition.row * size + offsetY);
    if (x + size >= 0 && x <= viewport.width && y + size >= 0 && y <= viewport.height) {
        const isOccupied = 
            (walls || []).some(w => w.row === hoverPosition.row && w.col === hoverPosition.col) ||
            (pieces || []).some(p => p.row === hoverPosition.row && p.col === hoverPosition.col);

        if (placementMode === 'wall' && wallShape === 'pen') {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = isOccupied ? '#ff0000' : '#555';
            const adjustedWallSize = size * (wallSizePercentage / 100);
            const wallOffset = (size - adjustedWallSize) / 2;
            ctx.fillRect(x + wallOffset, y + wallOffset, adjustedWallSize, adjustedWallSize);
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = isOccupied ? '#ff0000' : '#00c';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + wallOffset, y + wallOffset, adjustedWallSize, adjustedWallSize);
        } else if (placementMode === 'piece') {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = isOccupied ? '#ff0000' : '#7d7dff';
            ctx.fillRect(x, y, size, size);
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = isOccupied ? '#ff0000' : '#00c';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, size, size);
        } else if (placementMode === 'eraser' && eraserShape === 'pen') {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ff5555';
            ctx.fillRect(x, y, size, size);
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, size, size);
            if (isOccupied) {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(x + size * 0.3, y + size * 0.3, size * 0.4, size * 0.4);
                ctx.globalAlpha = 1.0;
            }
        }
    }
}

function drawSelectionRectangle(ctx, walls, pieces, placementMode, eraserShape, selectionStart, hoverPosition, size, offsetX, offsetY) {
    if (!(placementMode === 'eraser' && eraserShape === 'square' && selectionStart && hoverPosition)) return;

    const startX = Math.round(selectionStart.col * size + offsetX);
    const startY = Math.round(selectionStart.row * size + offsetY);
    const endX = Math.round(hoverPosition.col * size + offsetX);
    const endY = Math.round(hoverPosition.row * size + offsetY);

    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX) + size;
    const height = Math.abs(endY - startY) + size;

    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#ff5555';
    ctx.fillRect(left, top, width, height);

    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(left, top, width, height);

    ctx.globalAlpha = 0.4;
    const minRow = Math.min(selectionStart.row, hoverPosition.row);
    const maxRow = Math.max(selectionStart.row, hoverPosition.row);
    const minCol = Math.min(selectionStart.col, hoverPosition.col);
    const maxCol = Math.max(selectionStart.col, hoverPosition.col);

    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            const hasWallOrPiece = 
                (walls || []).some(w => w.row === r && w.col === c) ||
                (pieces || []).some(p => p.row === r && p.col === c);
            if (hasWallOrPiece) {
                const cellX = Math.round(c * size + offsetX);
                const cellY = Math.round(r * size + offsetY);
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(cellX + size * 0.3, cellY + size * 0.3, size * 0.4, size * 0.4);
            }
        }
    }
    ctx.globalAlpha = 1.0;
}

// --- Visitor Rendering ---
/**
 * Draws a single visitor stickman.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Visitor} visitor 
 * @param {number} size Cell size (used for scaling visitor parts)
 * @param {number} visitorScreenX Screen X coordinate
 * @param {number} visitorScreenY Screen Y coordinate
 */
function drawSingleVisitor(ctx, visitor, size, visitorScreenX, visitorScreenY) {
    const app = visitor.appearance;
    const scale = size * 0.8; // Scale visitor size based on cell size

    // Body
    const bodyStartY = visitorScreenY - app.bodyLength * scale / 2;
    const bodyEndY = visitorScreenY + app.bodyLength * scale / 2;
    
    ctx.strokeStyle = app.color;
    ctx.lineWidth = Math.max(1, size * 0.05); // Adjust line width based on zoom
    ctx.beginPath();
    ctx.moveTo(visitorScreenX, bodyStartY);
    ctx.lineTo(visitorScreenX, bodyEndY);
    ctx.stroke();

    // Head
    ctx.fillStyle = app.color;
    ctx.beginPath();
    ctx.arc(visitorScreenX, bodyStartY - app.headRadius * scale, app.headRadius * scale, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    const legAngle = Math.PI / 6; // 30 degrees
    ctx.beginPath();
    ctx.moveTo(visitorScreenX - Math.sin(legAngle) * app.legLength * scale, bodyEndY + Math.cos(legAngle) * app.legLength * scale);
    ctx.lineTo(visitorScreenX, bodyEndY);
    ctx.lineTo(visitorScreenX + Math.sin(legAngle) * app.legLength * scale, bodyEndY + Math.cos(legAngle) * app.legLength * scale);
    ctx.stroke();
    
    // Arms (pointing downwards)
    const armY = visitorScreenY - app.bodyLength * scale * 0.3; // Changed from 0.1 to 0.3 to move arms higher
    const armAngle = Math.PI / 4; // 45 degrees downwards from horizontal
    ctx.beginPath();
    // Left arm
    ctx.moveTo(visitorScreenX, armY);
    ctx.lineTo(visitorScreenX - Math.cos(armAngle) * app.armLength * scale * 1.2, armY + Math.sin(armAngle) * app.armLength * scale * 1.2);
    // Right arm
    ctx.moveTo(visitorScreenX, armY);
    ctx.lineTo(visitorScreenX + Math.cos(armAngle) * app.armLength * scale * 1.2, armY + Math.sin(armAngle) * app.armLength * scale * 1.2);
    ctx.stroke();

    // Comment Bubble (if any)
    if (visitor.currentComment) {
        const comment = visitor.currentComment;
        const commentX = visitorScreenX;
        const commentY = bodyStartY - app.headRadius * scale * 2.5; // Above head
        
        ctx.font = `${Math.max(10, size * 0.2)}px Arial`; // Adjust font size with zoom
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        const textWidth = ctx.measureText(comment).width;
        const padding = size * 0.1;
        const bubbleWidth = textWidth + 2 * padding;
        const bubbleHeight = Math.max(12, size * 0.2) + 2 * padding; // Font size + padding
        const bubbleX = commentX - bubbleWidth / 2;
        const bubbleY = commentY - bubbleHeight;

        // Simple rectangular bubble
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Semi-transparent white
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
        ctx.fill();
        ctx.stroke();

        // Text inside bubble
        ctx.fillStyle = '#000'; // Black text
        ctx.fillText(comment, commentX, commentY - padding);
    }
}

/**
 * Draws all visitors.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array<Visitor>} visitors 
 * @param {number} size Cell size
 * @param {number} offsetX Board offset X
 * @param {number} offsetY Board offset Y
 * @param {object} viewport Viewport dimensions
 */
function drawVisitors(ctx, visitors, size, offsetX, offsetY, viewport) {
    if (!visitors || visitors.length === 0) return;

    visitors.forEach(visitor => {
        // Convert visitor float coords to screen coords
        // const visitorScreenX = Math.round(visitor.x * size + offsetX + size / 2); // Center visitor in their "cell"
        // const visitorScreenY = Math.round(visitor.y * size + offsetY + size / 2);
        // Convert visitor grid coords to screen coords, centering the sprite
        const visitorScreenX = Math.round(visitor.col * size + offsetX + size / 2); 
        const visitorScreenY = Math.round(visitor.row * size + offsetY + size / 2);
        const visitorRenderRadius = size; // Generous radius for visibility check

        // Basic visibility check (similar to pieces/walls)
        if (visitorScreenX + visitorRenderRadius >= 0 && 
            visitorScreenX - visitorRenderRadius <= viewport.width && 
            visitorScreenY + visitorRenderRadius >= 0 && 
            visitorScreenY - visitorRenderRadius <= viewport.height)
        {
            drawSingleVisitor(ctx, visitor, size, visitorScreenX, visitorScreenY);
        }
    });
}
// -----------------------

export function renderBoard(canvas, state) {
    if (!canvas) return;
    const { 
        viewport, center, cellSize, 
        walls, pieces, visitors, // Add visitors to state destructuring
        placementMode, 
        hoverPosition, wallSizePercentage, 
        wallShape, drawingLine, imagesLoaded, 
        eraserShape, selectionStart 
    } = state;

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    const size = Math.round(cellSize);

    const cols = Math.ceil(viewport.width / size) + 2;
    const rows = Math.ceil(viewport.height / size) + 2;
    const offsetX = viewport.width / 2 - center.col * size;
    const offsetY = viewport.height / 2 - center.row * size;
    const startCol = Math.floor(center.col - cols / 2) - 1;
    const startRow = Math.floor(center.row - rows / 2) - 1;

    // Calculate visible grid bounds (with a small buffer)
    const buffer = 2; // Cells outside viewport to include for partial visibility
    const visibleBounds = {
        minRow: startRow - buffer,
        maxRow: startRow + rows + buffer,
        minCol: startCol - buffer,
        maxCol: startCol + cols + buffer
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid(ctx, viewport, center, size, startRow, startCol, rows, cols, offsetX, offsetY);
    // Pass visibleBounds to drawWalls and drawPieces
    drawWalls(ctx, walls, size, offsetX, offsetY, viewport, wallSizePercentage, visibleBounds);
    if (imagesLoaded) {
        drawPieces(ctx, pieces, size, offsetX, offsetY, viewport, visibleBounds);
    }
    drawVisitors(ctx, visitors, size, offsetX, offsetY, viewport); // Draw visitors
    drawShapePreview(ctx, walls, pieces, placementMode, drawingLine, hoverPosition, wallShape, size, offsetX, offsetY, viewport);
    drawHoverIndicator(ctx, walls, pieces, placementMode, hoverPosition, wallShape, eraserShape, size, offsetX, offsetY, viewport, wallSizePercentage);
    drawSelectionRectangle(ctx, walls, pieces, placementMode, eraserShape, selectionStart, hoverPosition, size, offsetX, offsetY);
} 