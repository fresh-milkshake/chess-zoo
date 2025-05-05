import React from 'react';
import ChessZooBoard from './components/ChessZooBoard';
import ControlPanel from './components/ControlPanel';
import { useChessZooState } from './hooks/useChessZooState';
import './ChessZooApp.css';

function ChessZooApp() {
  // Use the central state management hook
  const appState = useChessZooState();

  return (
    <div className="chess-zoo-app">
      {/* Control Panel Component */}
      <ControlPanel {...appState} />

      {/* Board Component */}
      <div className="zoo-board-container">
        <ChessZooBoard 
          zooData={appState.zooData} 
          onBoardClick={appState.handleBoardClick}
          resetLastPenPosition={appState.resetLastPenPosition}
          placementMode={appState.placementMode}
          wallSizePercentage={appState.wallSizePercentage}
          wallShape={appState.wallShape}
          drawingLine={appState.drawingLine}
          eraserShape={appState.eraserShape}
          visitors={appState.visitors}
        />
      </div>
    </div>
  );
}

export default ChessZooApp; 