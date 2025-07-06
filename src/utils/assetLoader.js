// SVG Chess piece images from Wikipedia
export const PIECE_IMAGES = {
  K: null, Q: null, R: null, B: null, N: null, P: null,
  k: null, q: null, r: null, b: null, n: null, p: null,
};

let imagesLoadedPromise = null;

// Load all chess piece images
export const loadChessPieceImages = () => {
  if (imagesLoadedPromise) {
    return imagesLoadedPromise; // Return existing promise if already loading/loaded
  }

  imagesLoadedPromise = new Promise((resolve) => {
    const pieces = Object.keys(PIECE_IMAGES);
    // Update baseUrl to work with GitHub Pages
    const baseUrl = process.env.PUBLIC_URL + '/images/pieces/'; 
    
    // Keep original Wikipedia filenames
    const imagePaths = {
      K: 'Chess_klt45.svg',
      Q: 'Chess_qlt45.svg',
      R: 'Chess_rlt45.svg',
      B: 'Chess_blt45.svg',
      N: 'Chess_nlt45.svg',
      P: 'Chess_plt45.svg',
      k: 'Chess_kdt45.svg',
      q: 'Chess_qdt45.svg',
      r: 'Chess_rdt45.svg', // Ensure this file exists locally
      b: 'Chess_bdt45.svg',
      n: 'Chess_ndt45.svg',
      p: 'Chess_pdt45.svg',
    };
    
    let loadedCount = 0;
    const totalImages = pieces.length;
    let successfulLoads = 0;

    if (totalImages === 0) {
      resolve(true); // Resolve immediately if no pieces defined
      return;
    }
    
    pieces.forEach((pieceType) => {
      const path = imagePaths[pieceType];
      if (!path) {
        console.error(`Missing image path for piece type: ${pieceType}`);
        loadedCount++;
        if (loadedCount === totalImages) resolve(successfulLoads > 0);
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        PIECE_IMAGES[pieceType] = img;
        loadedCount++;
        successfulLoads++;
        if (loadedCount === totalImages) {
          console.log('All chess piece images loaded locally.');
          resolve(true); // Resolve with true if all loaded
        }
      };
      img.onerror = () => {
        console.error(`Failed to load image for ${pieceType} from local path: ${baseUrl + path}`);
        loadedCount++;
        if (loadedCount === totalImages) {
           resolve(successfulLoads > 0); // Resolve based on whether *any* loaded successfully
        }
      };
      img.src = baseUrl + path;
    });
  });

  return imagesLoadedPromise;
}; 