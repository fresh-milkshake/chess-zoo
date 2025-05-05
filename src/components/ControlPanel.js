import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faStepForward,
  faUndo,
  faRandom,
  faPlus,
  faMinus,
  faTrash,
  faEraser,
  faPen,
  faDrawPolygon,
  faCircle,
  faSquare,
  faPuzzlePiece,
  faChessBoard,
  faFileExport,
  faFileImport,
  faCog,
  faChess,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { PREDEFINED_POSITIONS } from '../predefinedPositions';
import { PIECE_TYPES } from '../logic/chessLogic';
import { PIECE_IMAGES } from '../utils/assetLoader';

function ControlPanel({ 
    zooData, 
    originalZooData,
    simulationActive, 
    simulationSpeed, 
    placementMode, 
    wallSizePercentage, 
    wallShape, 
    eraserShape, 
    drawingLine,
    selectedPiece, 
    selectedPositionIndex,
    collapsedSections,
    // Handlers
    toggleSectionCollapse,
    handleLoadPredefinedPosition,
    handleExportPosition,
    handleImportPosition,
    handleToggleSimulation,
    handleStepForward,
    handleReset,
    handleAddRandomPiece,
    handleSpeedChange,
    handlePlacementModeToggle,
    handleWallShapeChange,
    handleWallSizeChange,
    handleEraserShapeChange,
    handlePieceSelection,
    handleClearWalls,
    handleClearPieces,
    handleClearAll,
    setDrawingLine,
    // Visitor handlers
    visitors
}) {

  return (
    <div className="control-panel">
      <h2><FontAwesomeIcon icon={faChess} /> Chess Zoo</h2>
      
      {/* Positions Section */}
      <div className="control-section">
        <div className="section-header" onClick={() => toggleSectionCollapse('positions')}>
          <h3><FontAwesomeIcon icon={faChessBoard} /> Positions</h3>
          <FontAwesomeIcon icon={collapsedSections.positions ? faPlus : faMinus} />
        </div>
        <div className={`section-content ${collapsedSections.positions ? 'collapsed' : ''}`}>
          <div className="position-selector">
            <label htmlFor="position-select">Select Position:</label>
            <select 
              id="position-select"
              value={selectedPositionIndex}
              onChange={(e) => handleLoadPredefinedPosition(Number(e.target.value))}
              className="position-dropdown"
            >
              {PREDEFINED_POSITIONS.map((position, index) => (
                <option key={position.name} value={index}>
                  {position.name}
                </option>
              ))}
            </select>
            <button 
              className="load-position-button"
              onClick={() => handleLoadPredefinedPosition(selectedPositionIndex)}
            >
              Load Position
            </button>
          </div>
          
          <div className="export-import-buttons">
            <button onClick={handleExportPosition} disabled={!zooData || (!zooData.pieces?.length && !zooData.walls?.length)}>
              <FontAwesomeIcon icon={faFileExport} /> Export
            </button>
            <button onClick={handleImportPosition}>
              <FontAwesomeIcon icon={faFileImport} /> Import
            </button>
          </div>
        </div>
      </div>
      
      {/* Simulation Section */}
      <div className="control-section">
        <div className="section-header" onClick={() => toggleSectionCollapse('simulation')}>
          <h3><FontAwesomeIcon icon={faCog} /> Simulation</h3>
          <FontAwesomeIcon icon={collapsedSections.simulation ? faPlus : faMinus} />
        </div>
        <div className={`section-content ${collapsedSections.simulation ? 'collapsed' : ''}`}>
          <div className="control-buttons">
            <button 
              className={`icon-button ${simulationActive ? 'active' : ''}`}
              onClick={handleToggleSimulation} 
              disabled={!zooData || !zooData.pieces?.length}
              title={simulationActive ? "Pause" : "Play"}
            >
              <FontAwesomeIcon icon={simulationActive ? faPause : faPlay} />
            </button>
            
            <button 
              className="icon-button"
              onClick={handleStepForward} 
              disabled={!zooData || !zooData.pieces?.length || simulationActive}
              title="Step Forward"
            >
              <FontAwesomeIcon icon={faStepForward} />
            </button>
            
            <button 
              className="icon-button"
              onClick={handleReset} 
              disabled={!originalZooData}
              title="Reset"
            >
              <FontAwesomeIcon icon={faUndo} />
            </button>
            
            <button 
              className="icon-button"
              onClick={handleAddRandomPiece} 
              disabled={!zooData}
              title="Add Random Piece"
            >
              <FontAwesomeIcon icon={faRandom} />
            </button>
          </div>
          
          <div className="slider-control">
            <label>Simulation Speed</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={Math.min(100, Math.max(0, (1050 - simulationSpeed) / 10))}
              onChange={handleSpeedChange}
              className="slider"
            />
            <span>{(1000 / simulationSpeed).toFixed(1)} moves/s</span>
          </div>
        </div>
      </div>
      
      {/* Drawing Tools Section */}
      <div className="control-section">
        <div className="section-header" onClick={() => toggleSectionCollapse('drawingTools')}>
          <h3><FontAwesomeIcon icon={faPuzzlePiece} /> Drawing Tools</h3>
          <FontAwesomeIcon icon={collapsedSections.drawingTools ? faPlus : faMinus} />
        </div>
        <div className={`section-content ${collapsedSections.drawingTools ? 'collapsed' : ''}`}>
          <div className="placement-controls">
            <button 
              className={`placement-button ${placementMode === 'wall' ? 'active' : ''}`} 
              onClick={() => handlePlacementModeToggle('wall')}
              title="Place Walls"
            >
              <FontAwesomeIcon icon={faDrawPolygon} />
              Walls
            </button>
            <button 
              className={`placement-button ${placementMode === 'piece' ? 'active' : ''}`} 
              onClick={() => handlePlacementModeToggle('piece')}
              title="Place Pieces"
            >
              <FontAwesomeIcon icon={faPuzzlePiece} />
              Pieces
            </button>
            <button 
              className={`placement-button ${placementMode === 'visitor' ? 'active' : ''}`} 
              onClick={() => handlePlacementModeToggle('visitor')}
              title="Place Visitors"
            >
              <FontAwesomeIcon icon={faUsers} />
              Visitors
            </button>
            <button 
              className={`placement-button ${placementMode === 'eraser' ? 'active' : ''}`} 
              onClick={() => handlePlacementModeToggle('eraser')}
              title="Erase Walls and Pieces"
            >
              <FontAwesomeIcon icon={faEraser} />
              Eraser
            </button>
          </div>
          
          {/* Wall Controls */}
          {placementMode === 'wall' && (
            <div className="wall-controls">
              <h4>Wall Shape</h4>
              <div className="wall-shape-selector">
                <button 
                  className={`shape-button ${wallShape === 'pen' ? 'active' : ''}`}
                  onClick={() => handleWallShapeChange('pen')}
                >
                  <FontAwesomeIcon icon={faPen} /> Pen
                </button>
                <button 
                  className={`shape-button ${wallShape === 'square' ? 'active' : ''}`}
                  onClick={() => handleWallShapeChange('square')}
                >
                  <FontAwesomeIcon icon={faDrawPolygon} /> Square
                </button>
                <button 
                  className={`shape-button ${wallShape === 'circle' ? 'active' : ''}`}
                  onClick={() => handleWallShapeChange('circle')}
                >
                  <FontAwesomeIcon icon={faCircle} /> Circle
                </button>
                <button 
                  className={`shape-button ${wallShape === 'line' ? 'active' : ''}`}
                  onClick={() => handleWallShapeChange('line')}
                >
                   Line
                </button>
              </div>
              
              <div className="slider-control">
                <label>Wall Size</label>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={wallSizePercentage}
                  onChange={handleWallSizeChange}
                  className="slider"
                />
                <span>{wallSizePercentage}%</span>
              </div>
              
              {wallShape === 'line' && drawingLine && (
                <div className="drawing-info">
                  Drawing line from ({drawingLine.startRow}, {drawingLine.startCol})
                  <button onClick={() => setDrawingLine(null)}>Cancel</button>
                </div>
              )}
            </div>
          )}
          
          {/* Eraser Controls */}
          {placementMode === 'eraser' && (
            <div className="eraser-controls">
              <h4>Eraser Options</h4>
              <div className="eraser-shape-selector">
                <button 
                  className={`shape-button ${eraserShape === 'pen' ? 'active' : ''}`}
                  onClick={() => handleEraserShapeChange('pen')}
                >
                  <FontAwesomeIcon icon={faPen} /> Pen
                </button>
                <button 
                  className={`shape-button ${eraserShape === 'square' ? 'active' : ''}`}
                  onClick={() => handleEraserShapeChange('square')}
                >
                  <FontAwesomeIcon icon={faSquare} /> Square
                </button>
              </div>
            </div>
          )}
          
          {/* Piece Controls */}
          {placementMode === 'piece' && (
            <div className="piece-controls">
              <h4>Select Piece</h4>
              <div className="piece-color-selector">
                <button 
                  className={`color-button white ${selectedPiece.color === 'w' ? 'active' : ''}`}
                  onClick={() => handlePieceSelection(selectedPiece.type, 'w')}
                >
                  White
                </button>
                <button 
                  className={`color-button black ${selectedPiece.color === 'b' ? 'active' : ''}`}
                  onClick={() => handlePieceSelection(selectedPiece.type, 'b')}
                >
                  Black
                </button>
              </div>
              <div className="piece-type-selector">
                {PIECE_TYPES.map(pieceType => {
                  const imageKey = selectedPiece.color === 'w' ? pieceType : pieceType.toLowerCase();
                  const imageSrc = PIECE_IMAGES[imageKey]?.src;
                  
                  return (
                    <button 
                      key={pieceType}
                      className={`piece-button ${selectedPiece.type === pieceType ? 'active' : ''}`}
                      onClick={() => handlePieceSelection(pieceType, selectedPiece.color)}
                      title={`Select ${pieceType}`}
                    >
                      {imageSrc ? (
                        <img 
                          src={imageSrc} 
                          alt={pieceType} 
                          className="piece-selector-image" 
                        />
                      ) : (
                        pieceType
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Clear Buttons (visible when drawing tools expanded) */}
          <div className="visitor-count-display" style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
            Current Visitors: {visitors?.length || 0}
          </div>
          <div className="clear-buttons">
            <button onClick={handleClearWalls} disabled={!zooData || !zooData.walls?.length}>
              <FontAwesomeIcon icon={faTrash} /> Walls
            </button>
            <button onClick={handleClearPieces} disabled={!zooData || !zooData.pieces?.length}>
              <FontAwesomeIcon icon={faTrash} /> Pieces
            </button>
            <button onClick={handleClearAll} disabled={!zooData || (!zooData.pieces?.length && !zooData.walls?.length)}>
              <FontAwesomeIcon icon={faTrash} /> Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel; 