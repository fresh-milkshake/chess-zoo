import React, { useRef, useEffect, useState, useMemo } from 'react';
import '../ChessZooBoard.css';
import { useBoardInteractions } from '../hooks/useBoardInteractions';
import { loadChessPieceImages } from '../utils/assetLoader'; 
import { renderBoard } from '../rendering/boardRenderer';

// Removed all local duplicate function declarations and constants.
// Functions like loadChessPieceImages, calculateLinePath, etc., are now imported.

function ChessZooBoard({ 
  zooData, 
  onBoardClick, 
  resetLastPenPosition,
  placementMode, 
  wallSizePercentage = 65,
  wallShape = 'pen',
  drawingLine = null,
  eraserShape = 'pen',
  visitors,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Load chess piece images on mount using the imported function
  useEffect(() => {
    loadChessPieceImages().then((success) => {
      setImagesLoaded(success);
      if (!success) {
        console.error("Failed to load essential chess piece images.");
      }
    });
  }, []);

  // Use the custom hook for interactions
  const {
    cellSize,
    center,
    viewport,
    hoverPosition,
    isBoardMoving,
    isPenDrawing,
    selectionStart,
    isSpacePanning,
    cursorStyle,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onWheel,
  } = useBoardInteractions(
      containerRef, 
      canvasRef, 
      placementMode, 
      wallShape, 
      eraserShape, 
      drawingLine, 
      onBoardClick, 
      resetLastPenPosition
  );

  // Render the board using the dedicated renderer
  useEffect(() => {
      renderBoard(canvasRef.current, {
          // Pass all necessary state to the renderer
          viewport,
          center,
          cellSize,
          walls: zooData?.walls || [],
          pieces: zooData?.pieces || [],
          placementMode,
          hoverPosition,
          wallSizePercentage,
          wallShape,
          drawingLine,
          imagesLoaded,
          eraserShape,
          selectionStart,
          visitors,
      });
  }, [
      // Dependencies for re-rendering
      viewport, center, cellSize, zooData, placementMode, hoverPosition,
      wallSizePercentage, wallShape, drawingLine, imagesLoaded, eraserShape, 
      selectionStart,
      visitors,
  ]);

  return (
    <div
      className={`chess-zoo-board-responsive ${ 
        isSpacePanning ? 'space-panning' : ''
      } ${isBoardMoving ? 'board-moving' : ''} ${isPenDrawing ? 'active-drawing' : ''}`}
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove} 
      onMouseUp={onMouseUp}     
      onWheel={onWheel}
      style={{ cursor: cursorStyle }} 
      tabIndex={0} 
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', left: 0, top: 0, zIndex: 1 }}
      />
      {!imagesLoaded && (
        <div className="loading-indicator"> 
          Loading chess pieces...
        </div>
      )}
    </div>
  );
}

export default React.memo(ChessZooBoard);
