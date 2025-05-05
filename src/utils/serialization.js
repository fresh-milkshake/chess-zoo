import { v4 as uuidv4 } from 'uuid';

// Enhanced PGN-like format serialization
export function serializeZooData(data) {
  if (!data || (!data.walls?.length && !data.pieces?.length)) {
    return '';
  }
  
  // Serialize walls
  const wallsStr = (data.walls || []).map(wall => 
    `${wall.row},${wall.col}${wall.type ? ',' + wall.type : ',wall'}` // Ensure type 'wall' is added if missing
  ).join(';');
  
  // Serialize pieces
  const piecesStr = (data.pieces || []).map(piece => 
    `${piece.row},${piece.col},${piece.type},${piece.color},${piece.id || uuidv4()}` // Assign ID if missing during serialization
  ).join(';');
  
  return `W:${wallsStr}|P:${piecesStr}`;
}

// Parse the custom Zoo string format
export function parseZooString(zooStr) {
  if (!zooStr || typeof zooStr !== 'string') {
      console.error("Invalid Zoo string provided to parseZooString");
      return { walls: [], pieces: [] }; // Return empty board on invalid input
  }
  try {
    // Example format:
    // W:0,0,square;0,1,circle;1,0,wall|P:2,2,K,w;3,3,Q,w;4,4,k,b
    const parts = zooStr.split('|');
    const wallPart = parts.find(p => p.startsWith('W:')) || 'W:';
    const piecePart = parts.find(p => p.startsWith('P:')) || 'P:';
    
    const walls = wallPart
      .replace('W:', '')
      .split(';')
      .filter(Boolean)
      .map(s => {
        const p = s.split(',');
        if (p.length < 2) return null; // Need at least row,col
        const wall = { row: Number(p[0]), col: Number(p[1]) };
        // Assign type if present, otherwise default to 'wall'
        wall.type = p.length > 2 && p[2] ? p[2] : 'wall'; 
        if (isNaN(wall.row) || isNaN(wall.col)) return null; // Basic validation
        return wall;
      })
      .filter(w => w !== null); // Remove invalid entries
      
    const pieces = piecePart
      .replace('P:', '')
      .split(';')
      .filter(Boolean)
      .map(s => {
        const [row, col, type, color, id] = s.split(','); // Add id
        if (row === undefined || col === undefined || type === undefined || color === undefined) return null;
        const piece = { 
            row: Number(row), 
            col: Number(col), 
            type, 
            color, 
            id: id || uuidv4() // Generate ID if missing from parsed string
        };
        // Basic validation
        if (isNaN(piece.row) || isNaN(piece.col) || !type || !color) return null;
        return piece;
      })
      .filter(p => p !== null); // Remove invalid entries
      
    return { walls, pieces };
  } catch (e) {
      console.error("Error parsing Zoo string:", zooStr, e);
      return { walls: [], pieces: [] }; // Return empty board on error
  }
} 