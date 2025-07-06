import { useState, useEffect, useRef, useCallback } from 'react';
import { PREDEFINED_POSITIONS } from '../predefinedPositions';
import { PIECE_TYPES, isOutOfBounds, getPieceAt, isWallAt } from '../logic/chessLogic';
import { calculateBresenhamLine, calculateSquarePath, calculateCirclePath } from '../logic/drawing';
import { serializeZooData, parseZooString } from '../utils/serialization';
import { performSingleRandomMove } from '../logic/simulation';
import { createRandomVisitor, updateVisitor } from '../visitors/visitorLogic';
import { v4 as uuidv4 } from 'uuid';

export function useChessZooState() {
    const [zooData, setZooData] = useState({ walls: [], pieces: [] });
    const [visitors, setVisitors] = useState([]);
    const [simulationActive, setSimulationActive] = useState(false);
    const [simulationSpeed, setSimulationSpeed] = useState(1000); // ms between moves
    const [selectedPiece, setSelectedPiece] = useState({ type: 'K', color: 'w' });
    const [placementMode, setPlacementMode] = useState(null); // 'wall', 'piece', 'visitor', or 'eraser'
    const [originalZooData, setOriginalZooData] = useState({ walls: [], pieces: [] });
    const [wallSizePercentage, setWallSizePercentage] = useState(80);
    const [wallShape, setWallShape] = useState('pen');
    const [eraserShape, setEraserShape] = useState('pen');
    const [drawingLine, setDrawingLine] = useState(null);
    const [selectedPositionIndex, setSelectedPositionIndex] = useState(0);
    const [collapsedSections, setCollapsedSections] = useState({
        positions: false,
        simulation: false, 
        drawingTools: false
    });
    
    const animationRef = useRef(null);
    const lastUpdateTime = useRef(Date.now());
    const [lastPenPosition, setLastPenPosition] = useState(null);
    // Add timer for visitor updates
    const lastVisitorUpdateTime = useRef(Date.now());
    const VISITOR_UPDATE_INTERVAL = 150; // ms - Update visitors less frequently

    // Initialize with the first predefined position
    useEffect(() => {
        const initialPgn = PREDEFINED_POSITIONS[0].pgn;
        const initialData = parseZooString(initialPgn);
        setZooData(initialData);
        setOriginalZooData(initialData);
        setVisitors([]);
    }, []);

    // Simulation Loop Logic
    const runSimulationStep = useCallback(() => {
        setZooData(currentData => {
            const piecesWithIds = currentData.pieces.map(p => ({ ...p, id: p.id || uuidv4() }));
            const updatedData = performSingleRandomMove({ ...currentData, pieces: piecesWithIds });
            return updatedData;
        });
        lastUpdateTime.current = Date.now();
    }, []);

    // Visitor Update Logic (runs independently or as part of main loop)
    const runVisitorUpdateStep = useCallback(() => {
        setVisitors(currentVisitors => {
            if (!zooData || !zooData.pieces) return currentVisitors;
            const piecesWithIds = zooData.pieces.map(p => ({ ...p, id: p.id || uuidv4() }));
            return currentVisitors.map(visitor => 
                updateVisitor(visitor, piecesWithIds, zooData.walls || [], currentVisitors)
            );
        });
    }, [zooData]);

    useEffect(() => {
        let animationFrameId = null;
        const updateAnimation = () => {
            const now = Date.now();
            const elapsed = now - lastUpdateTime.current;
            const elapsedVisitor = now - lastVisitorUpdateTime.current;

            // Piece Simulation Step
            if (simulationActive && elapsed >= simulationSpeed) {
                runSimulationStep(); 
            }

            // Visitor Update Step (throttled)
            if (elapsedVisitor >= VISITOR_UPDATE_INTERVAL) {
                runVisitorUpdateStep();
                lastVisitorUpdateTime.current = now; // Reset visitor timer
            }
            
            animationFrameId = requestAnimationFrame(updateAnimation);
        };
        
        if (simulationActive) {
            animationFrameId = requestAnimationFrame(updateAnimation);
        } else {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        }
        
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [simulationActive, simulationSpeed, runSimulationStep, runVisitorUpdateStep]);

    // --- Event Handlers ---

    const resetLastPenPosition = useCallback(() => {
        setLastPenPosition(null);
    }, []);

    const handleLoadPredefinedPosition = useCallback((index) => {
        setSelectedPositionIndex(index);
        const pgnString = PREDEFINED_POSITIONS[index].pgn;
        const parsedData = parseZooString(pgnString);
        setZooData(parsedData);
        setOriginalZooData(parsedData);
        setSimulationActive(false);
        setDrawingLine(null);
        resetLastPenPosition();
        setVisitors([]);
    }, [resetLastPenPosition]);

    const handleToggleSimulation = useCallback(() => {
        setSimulationActive(prev => !prev);
        lastUpdateTime.current = Date.now();
    }, []);

    const handleStepForward = useCallback(() => {
        if (zooData) {
            runSimulationStep();
        }
    }, [zooData, runSimulationStep]);

    const handleReset = useCallback(() => {
        if (originalZooData) {
            setZooData(originalZooData);
            setSimulationActive(false);
            setDrawingLine(null);
            resetLastPenPosition();
            setVisitors([]);
        }
    }, [originalZooData, resetLastPenPosition]);

    const handleSpeedChange = useCallback((e) => {
        // New formula: slider 0-100 maps to speed 1050ms down to 50ms
        const speed = 1050 - Number(e.target.value) * 10; 
        // Clamp the speed to a minimum of 50ms to avoid excessively high speeds
        setSimulationSpeed(Math.max(50, speed)); 
    }, []);

    const handleWallSizeChange = useCallback((e) => {
        setWallSizePercentage(Number(e.target.value));
    }, []);

    const handleClearWalls = useCallback(() => {
        setZooData(prev => ({ ...prev, walls: [] }));
    }, []);

    const handleClearPieces = useCallback(() => {
        setZooData(prev => ({ ...prev, pieces: [] }));
    }, []);

    const handleClearAll = useCallback(() => {
        const clearedData = { walls: [], pieces: [] };
        setZooData(clearedData);
        setOriginalZooData(clearedData); // Also reset original data if clearing all
        setSimulationActive(false);
        setDrawingLine(null);
        resetLastPenPosition();
        setVisitors([]);
    }, [resetLastPenPosition]);

    const handleAddRandomPiece = useCallback(() => {
        setZooData(prev => {
            const randomType = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
            const randomColor = Math.random() > 0.5 ? 'w' : 'b';
            let row, col;
            let attempts = 0;
            do {
                row = Math.floor(Math.random() * 10) - 5;
                col = Math.floor(Math.random() * 10) - 5;
                attempts++;
            } while (
                (prev.walls.some(w => w.row === row && w.col === col) || 
                 prev.pieces.some(p => p.row === row && p.col === col)) && 
                attempts < 20
            );
            
            if (attempts < 20) {
                return {
                    ...prev,
                    pieces: [...prev.pieces, { 
                        row, 
                        col, 
                        type: randomColor === 'w' ? randomType : randomType.toLowerCase(),
                        color: randomColor,
                        id: uuidv4()
                    }]
                };
            }
            return prev; // Return previous state if no empty spot found
        });
    }, []);

    const handlePlacementModeToggle = useCallback((mode) => {
        setPlacementMode(prev => {
            resetLastPenPosition();
            return prev === mode ? null : mode;
        });
    }, [resetLastPenPosition]);

    const handlePieceSelection = useCallback((pieceType, color) => {
        setSelectedPiece({ type: pieceType, color });
    }, []);

    const handleWallShapeChange = useCallback((shape) => {
        setWallShape(shape);
        resetLastPenPosition();
        if (shape === 'line' && placementMode !== 'wall') {
            setPlacementMode('wall');
        }
        setDrawingLine(null);
    }, [resetLastPenPosition, placementMode]);

    const handleEraserShapeChange = useCallback((shape) => {
        setEraserShape(shape);
        resetLastPenPosition();
        if (placementMode !== 'eraser') {
            setPlacementMode('eraser');
        }
    }, [resetLastPenPosition, placementMode]);

    const handleBoardClick = useCallback((row, col, endRow, endCol) => {
        // Handle visitor placement separately, as it doesn't modify zooData directly
        if (placementMode === 'visitor') {
            // Temporarily read walls/pieces from current zooData state
            // This is less ideal than getting it from a state setter's arg,
            // but necessary since we're outside setZooData.
            // Consider refactoring if zooData update timing becomes an issue.
            const currentWalls = zooData.walls;
            const currentPieces = zooData.pieces;
            
            // Check if the cell is free (from walls/pieces)
            if (!isWallAt(row, col, currentWalls) && !getPieceAt(row, col, currentPieces)) {
                // Create visitor slightly offset from grid corner for float coords
                // Create visitor at the clicked grid cell
                const newVisitor = createRandomVisitor(row, col);
                setVisitors(prev => [...prev, newVisitor]); 
            }
            return; // Visitor placement handled, exit early
        }
        
        // Handle other placement modes that modify zooData
        if (!placementMode || placementMode === 'visitor') return; // Should not happen if check above works, but safe guard

        setZooData(prevData => {
            let updatedWalls = [...prevData.walls];
            let updatedPieces = [...prevData.pieces];
            let newDrawingLine = drawingLine;

            // --- Square Selection Eraser ---
            if (placementMode === 'eraser' && eraserShape === 'square' && endRow !== undefined && endCol !== undefined) {
                const minRow = Math.min(row, endRow);
                const maxRow = Math.max(row, endRow);
                const minCol = Math.min(col, endCol);
                const maxCol = Math.max(col, endCol);
                updatedWalls = prevData.walls.filter(w => !(w.row >= minRow && w.row <= maxRow && w.col >= minCol && w.col <= maxCol));
                updatedPieces = prevData.pieces.filter(p => !(p.row >= minRow && p.row <= maxRow && p.col >= minCol && p.col <= maxCol));
                // Also erase visitors in the square
                setVisitors(prevVisitors => prevVisitors.filter(v => 
                    !(v.y >= minRow && v.y <= maxRow && v.x >= minCol && v.x <= maxCol)
                ));
            }
            // --- Wall Placement ---
            else if (placementMode === 'wall') {
                if (wallShape === 'line' || wallShape === 'square' || wallShape === 'circle') {
                    if (!drawingLine) {
                        newDrawingLine = { startRow: row, startCol: col };
                    } else {
                        const startRow = drawingLine.startRow;
                        const startCol = drawingLine.startCol;
                        const finalEndRow = row;
                        const finalEndCol = col;
                        let shapePoints = [];

                        if (wallShape === 'line') {
                            shapePoints = calculateBresenhamLine(startRow, startCol, finalEndRow, finalEndCol);
                        } else if (wallShape === 'square') {
                            shapePoints = calculateSquarePath(startRow, startCol, finalEndRow, finalEndCol);
                        } else if (wallShape === 'circle') {
                            const deltaRow = finalEndRow - startRow;
                            const deltaCol = finalEndCol - startCol;
                            const radius = Math.sqrt(deltaRow * deltaRow + deltaCol * deltaCol);
                            shapePoints = calculateCirclePath(startRow, startCol, radius);
                        }

                        const newShapeWalls = shapePoints
                            .map(p => ({ row: p.row, col: p.col, type: 'wall' }))
                            .filter(nw => 
                                !prevData.walls.some(w => w.row === nw.row && w.col === nw.col) &&
                                !prevData.pieces.some(p => p.row === nw.row && p.col === nw.col) &&
                                !updatedWalls.some(uw => uw.row === nw.row && uw.col === nw.col) 
                            );

                        updatedWalls = [...updatedWalls, ...newShapeWalls];
                        newDrawingLine = null;
                    }
                } 
                else {
                    if (!isWallAt(row, col, prevData.walls) && !getPieceAt(row, col, prevData.pieces)) {
                        if (lastPenPosition && (lastPenPosition.row !== row || lastPenPosition.col !== col)) {
                            const points = calculateBresenhamLine(lastPenPosition.row, lastPenPosition.col, row, col);
                            const newWallsSegment = points
                                .filter(p => 
                                    !isWallAt(p.row, p.col, prevData.walls) && 
                                    !getPieceAt(p.row, p.col, prevData.pieces) &&
                                    !updatedWalls.some(uw => uw.row === p.row && uw.col === p.col)
                                )
                                .map(p => ({ row: p.row, col: p.col, type: 'wall' }));
                            updatedWalls = [...updatedWalls, ...newWallsSegment];
                        } else {
                           if(!updatedWalls.some(uw => uw.row === row && uw.col === col)) {
                                updatedWalls.push({ row, col, type: 'wall' });
                           }
                        }
                        setLastPenPosition({ row, col });
                    } else {
                         setLastPenPosition({ row, col });
                    }
                }
            }
            // --- Piece Placement ---
            else if (placementMode === 'piece') {
                if (!isWallAt(row, col, prevData.walls) && !getPieceAt(row, col, prevData.pieces)) {
                    const pieceType = selectedPiece.color === 'w' ? selectedPiece.type : selectedPiece.type.toLowerCase();
                    updatedPieces.push({ 
                        row, 
                        col, 
                        type: pieceType, 
                        color: selectedPiece.color, 
                        id: uuidv4()
                    });
                }
            }
            // --- Eraser (Pen) ---
            else if (placementMode === 'eraser' && eraserShape === 'pen') {
                 if (lastPenPosition && (lastPenPosition.row !== row || lastPenPosition.col !== col)) {
                     const points = calculateBresenhamLine(lastPenPosition.row, lastPenPosition.col, row, col);
                     const pointSet = new Set(points.map(p => `${p.row},${p.col}`));
                     updatedWalls = prevData.walls.filter(w => !pointSet.has(`${w.row},${w.col}`));
                     updatedPieces = prevData.pieces.filter(p => !pointSet.has(`${p.row},${p.col}`));
                     // Also erase visitors hit by the pen line
                     setVisitors(prevVisitors => prevVisitors.filter(v => 
                         !pointSet.has(`${Math.floor(v.y)},${Math.floor(v.x)}`)
                     ));
                 } else {
                     // Single point erase
                     const pointKey = `${row},${col}`;
                     updatedWalls = prevData.walls.filter(w => !(w.row === row && w.col === col));
                     updatedPieces = prevData.pieces.filter(p => !(p.row === row && p.col === col));
                     // Also erase visitors in the clicked cell
                     setVisitors(prevVisitors => prevVisitors.filter(v => 
                         !(Math.floor(v.y) === row && Math.floor(v.x) === col)
                     ));
                 }
                 setLastPenPosition({ row, col });
            }

            if (drawingLine !== newDrawingLine) {
                setDrawingLine(newDrawingLine);
            }

            return { walls: updatedWalls, pieces: updatedPieces };
        });

        // Don't update lastPenPosition for visitor placement
        if ((placementMode === 'wall' && wallShape === 'pen') || (placementMode === 'eraser' && eraserShape === 'pen')) {
             setLastPenPosition({ row, col });
        }

    }, [placementMode, eraserShape, wallShape, drawingLine, lastPenPosition, selectedPiece, resetLastPenPosition, zooData.walls, zooData.pieces, setVisitors]);

    const handleExportPosition = useCallback(() => {
        if (!zooData) return;
        const serialized = serializeZooData(zooData);
        navigator.clipboard.writeText(serialized).then(() => {
            alert('Position copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy', err);
            prompt('Copy this position:', serialized);
        });
    }, [zooData]);

    const handleImportPosition = useCallback(() => {
        const positionStr = prompt('Paste position data:');
        if (!positionStr) return;
        try {
            const parsedData = parseZooString(positionStr);
            setZooData(parsedData);
            setOriginalZooData(parsedData);
            setSimulationActive(false);
            setDrawingLine(null);
            resetLastPenPosition();
            setVisitors([]);
        } catch (e) {
            console.error('Error importing position:', e);
            alert('Invalid position data. Please check the format and try again.');
        }
    }, [resetLastPenPosition]);

    const toggleSectionCollapse = useCallback((section) => {
        setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
    }, []);

    return {
        zooData,
        visitors,
        simulationActive,
        simulationSpeed,
        selectedPiece,
        placementMode,
        originalZooData,
        wallSizePercentage,
        wallShape,
        eraserShape,
        drawingLine,
        selectedPositionIndex,
        collapsedSections,
        lastPenPosition,
        setZooData,
        setSimulationActive,
        setSimulationSpeed,
        setSelectedPiece,
        setPlacementMode,
        setOriginalZooData,
        setWallSizePercentage,
        setWallShape,
        setEraserShape,
        setDrawingLine,
        setSelectedPositionIndex,
        setCollapsedSections,
        resetLastPenPosition,
        handleLoadPredefinedPosition,
        handleToggleSimulation,
        handleStepForward,
        handleReset,
        handleSpeedChange,
        handleWallSizeChange,
        handleClearWalls,
        handleClearPieces,
        handleClearAll,
        handleAddRandomPiece,
        handlePlacementModeToggle,
        handlePieceSelection,
        handleWallShapeChange,
        handleEraserShapeChange,
        handleBoardClick,
        handleExportPosition,
        handleImportPosition,
        toggleSectionCollapse,
    };
} 