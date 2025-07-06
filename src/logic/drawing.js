// Bresenham's line algorithm
export function calculateBresenhamLine(startRow, startCol, endRow, endCol) {
  const points = [];
  
  const dx = Math.abs(endCol - startCol);
  const dy = Math.abs(endRow - startRow);
  const sx = startCol < endCol ? 1 : -1;
  const sy = startRow < endRow ? 1 : -1;
  let err = dx - dy;
  
  let currentRow = startRow;
  let currentCol = startCol;
  
  while (true) {
    points.push({ row: currentRow, col: currentCol });
    
    if (currentRow === endRow && currentCol === endCol) break;
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      currentCol += sx;
    }
    if (e2 < dx) {
      err += dx;
      currentRow += sy;
    }
  }
  
  return points;
}

// Bresenham's circle algorithm
export function calculateCirclePath(centerRow, centerCol, radius) {
  const path = [];
  
  let x = Math.round(radius);
  let y = 0;
  let err = 0;
  
  while (x >= y) {
    // Add the 8 octants of the circle
    path.push({ row: centerRow + y, col: centerCol + x });
    path.push({ row: centerRow + x, col: centerCol + y });
    path.push({ row: centerRow - y, col: centerCol + x });
    path.push({ row: centerRow - x, col: centerCol + y });
    path.push({ row: centerRow - x, col: centerCol - y });
    path.push({ row: centerRow - y, col: centerCol - x });
    path.push({ row: centerRow + y, col: centerCol - x });
    path.push({ row: centerRow + x, col: centerCol - y });
    
    y += 1;
    err += 1 + 2 * y;
    if (2 * (err - x) + 1 > 0) {
      x -= 1;
      err += 1 - 2 * x;
    }
  }
  
  return path;
}

// Calculate points forming the outline of a square
export function calculateSquarePath(startRow, startCol, endRow, endCol) {
  const path = [];
  
  // Calculate the corners of the square
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);
  
  // Top side
  for (let c = minCol; c <= maxCol; c++) path.push({ row: minRow, col: c });
  // Right side (excluding top-right corner)
  for (let r = minRow + 1; r <= maxRow; r++) path.push({ row: r, col: maxCol });
  // Bottom side (excluding bottom-right corner)
  for (let c = maxCol - 1; c >= minCol; c--) path.push({ row: maxRow, col: c });
  // Left side (excluding bottom-left and top-left corners)
  for (let r = maxRow - 1; r > minRow; r--) path.push({ row: r, col: minCol });
  
  return path;
} 