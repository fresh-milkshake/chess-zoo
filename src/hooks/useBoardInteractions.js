import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const MIN_CELL_SIZE = 24;
const MAX_CELL_SIZE = 128;
const INITIAL_CELL_SIZE = 64;

export function useBoardInteractions(containerRef, canvasRef, placementMode, wallShape, eraserShape, drawingLine, onBoardClick, resetLastPenPosition) {
    const [cellSize, setCellSize] = useState(INITIAL_CELL_SIZE);
    const [center, setCenter] = useState({ row: 0, col: 0 });
    const [viewport, setViewport] = useState({ width: 800, height: 800 });
    const [hoverPosition, setHoverPosition] = useState(null);
    const [isBoardMoving, setIsBoardMoving] = useState(false);
    const [isPenDrawing, setIsPenDrawing] = useState(false);
    const [lastDrawnPosition, setLastDrawnPosition] = useState(null);
    const [selectionStart, setSelectionStart] = useState(null);
    const [isSpacePanning, setIsSpacePanning] = useState(false);
    
    const dragRef = useRef(null);

    // Update viewport size on resize
    useEffect(() => {
        function updateSize() {
            if (containerRef.current) {
                setViewport({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        }
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [containerRef]);

    // Convert screen coordinates to board coordinates
    const screenToBoard = useCallback((screenX, screenY) => {
        if (typeof screenX !== 'number' || typeof screenY !== 'number') return null;
        
        const size = Math.round(cellSize);
        const offsetX = viewport.width / 2 - center.col * size;
        const offsetY = viewport.height / 2 - center.row * size;
        
        const boardCol = Math.floor((screenX - offsetX) / size);
        const boardRow = Math.floor((screenY - offsetY) / size);
        
        return { row: boardRow, col: boardCol };
    }, [viewport, center, cellSize]);

    // Helper function to safely get board coordinates from an event
    const getBoardPositionFromEvent = useCallback((e) => {
        if (!e || !canvasRef.current) return null;
        
        const rect = canvasRef.current.getBoundingClientRect();
        let offsetX, offsetY;
        
        if (e.nativeEvent) {
            if (e.nativeEvent.offsetX !== undefined && e.nativeEvent.offsetY !== undefined) {
                offsetX = e.nativeEvent.offsetX;
                offsetY = e.nativeEvent.offsetY;
            } else if (e.nativeEvent.clientX !== undefined && e.nativeEvent.clientY !== undefined) {
                offsetX = e.nativeEvent.clientX - rect.left;
                offsetY = e.nativeEvent.clientY - rect.top;
            } else {
                return null;
            }
        } else {
            if (e.offsetX !== undefined && e.offsetY !== undefined) {
                offsetX = e.offsetX;
                offsetY = e.offsetY;
            } else if (e.clientX !== undefined && e.clientY !== undefined) {
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
            } else {
                return null;
            }
        }
        
        return screenToBoard(offsetX, offsetY);
    }, [screenToBoard, canvasRef]);

    // Spacebar key listeners for panning toggle
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.keyCode === 32) { // Spacebar
                if (!isSpacePanning) {
                    e.preventDefault();
                    setIsSpacePanning(true);
                }
            }
        };
        const handleKeyUp = (e) => {
            if (e.keyCode === 32) {
                setIsSpacePanning(false);
                if (dragRef.current && dragRef.current.isSpaceInitiated) {
                    dragRef.current = null;
                    setIsBoardMoving(false);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isSpacePanning]);

    const onMouseDown = useCallback((e) => {
        if (!e) return;
        const boardPos = getBoardPositionFromEvent(e);
        if (!boardPos) return;
        const { row, col } = boardPos;

        if (isSpacePanning) {
            e.preventDefault();
            const dragState = {
                startX: e.clientX,
                startY: e.clientY,
                startCenter: { ...center },
                isSpaceInitiated: true
            };
            dragRef.current = dragState;
            setIsBoardMoving(true);
            return;
        }
        
        if ((placementMode === 'wall' && wallShape === 'pen') || 
            (placementMode === 'eraser' && eraserShape === 'pen')) {
            e.preventDefault();
            setIsPenDrawing(true);
            if (onBoardClick) {
                onBoardClick(row, col);
                setLastDrawnPosition({ row, col });
            }
            return;
        }
        
        if (placementMode === 'eraser' && eraserShape === 'square') {
            e.preventDefault();
            setSelectionStart({ row, col });
            return;
        }
        
        if (placementMode === 'wall' && (wallShape === 'line' || wallShape === 'square' || wallShape === 'circle')) {
            if (onBoardClick) {
                onBoardClick(row, col);
            }
            return;
        }

        if (placementMode === 'piece' && onBoardClick) {
            onBoardClick(row, col);
            return;
        }

        // Add check for visitor placement mode
        if (placementMode === 'visitor' && onBoardClick) {
            onBoardClick(row, col);
            return;
        }
        
        if (!placementMode) {
            e.preventDefault();
            const dragState = {
                startX: e.clientX,
                startY: e.clientY,
                startCenter: { ...center },
                isSpaceInitiated: false
            };
            dragRef.current = dragState;
            setIsBoardMoving(true);
        }
    }, [getBoardPositionFromEvent, isSpacePanning, center, placementMode, wallShape, eraserShape, onBoardClick]);
   
    const onMouseMove = useCallback((e) => {
        if (!e) return;
        const boardPos = getBoardPositionFromEvent(e);
        if (!boardPos) {
             setHoverPosition(null);
             return;
        }
        const { row, col } = boardPos;
        setHoverPosition({ row, col });

        if (dragRef.current) {
            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            const newCenter = {
                row: dragRef.current.startCenter.row - dy / cellSize,
                col: dragRef.current.startCenter.col - dx / cellSize,
            };
            requestAnimationFrame(() => {
                setCenter(newCenter);
            });
            return;
        }

        if (isPenDrawing && 
            ((placementMode === 'wall' && wallShape === 'pen') || 
             (placementMode === 'eraser' && eraserShape === 'pen'))) {
            if (!lastDrawnPosition || lastDrawnPosition.row !== row || lastDrawnPosition.col !== col) {
                if (onBoardClick) {
                    onBoardClick(row, col);
                    setLastDrawnPosition({ row, col });
                }
            }
        }
    }, [getBoardPositionFromEvent, cellSize, isPenDrawing, placementMode, wallShape, eraserShape, lastDrawnPosition, onBoardClick]);
   
    const onMouseUp = useCallback((e) => {
        const isPanning = !!dragRef.current;
        const wasSpacePanning = dragRef.current?.isSpaceInitiated || false;
        dragRef.current = null;
        setTimeout(() => setIsBoardMoving(false), 50);

        if (wasSpacePanning) {
            if (isPenDrawing) {
                setIsPenDrawing(false);
                setLastDrawnPosition(null);
                if (resetLastPenPosition) resetLastPenPosition();
            }
            return;
        }

        if (selectionStart && placementMode === 'eraser' && eraserShape === 'square') {
            const boardPos = getBoardPositionFromEvent(e);
            if (boardPos && onBoardClick) {
                onBoardClick(selectionStart.row, selectionStart.col, boardPos.row, boardPos.col);
            }
            setSelectionStart(null);
        }

        if (placementMode === 'wall' && (wallShape === 'line' || wallShape === 'square' || wallShape === 'circle') && drawingLine && !isPanning) {
            const boardPos = getBoardPositionFromEvent(e);
            if (boardPos && onBoardClick) {
                onBoardClick(boardPos.row, boardPos.col);
            }
        }
        
        if (isPenDrawing) {
            setIsPenDrawing(false);
            setLastDrawnPosition(null);
            if (resetLastPenPosition) resetLastPenPosition();
        }
    }, [isPenDrawing, resetLastPenPosition, selectionStart, placementMode, eraserShape, getBoardPositionFromEvent, onBoardClick, wallShape, drawingLine]);

    // Mouse wheel to zoom
    const onWheel = useCallback((e) => {
        e.preventDefault();
        let newSize = cellSize - e.deltaY * 0.05;
        newSize = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, newSize));
        setCellSize(Math.round(newSize));
    }, [cellSize]);

    // Add global listeners during interaction phases
    useEffect(() => {
        const isInteracting = !!dragRef.current || isPenDrawing || !!selectionStart;
        if (isInteracting) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            return () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };
        }
    }, [isPenDrawing, selectionStart, onMouseMove, onMouseUp]);

    // Determine cursor style based on state
    const cursorStyle = useMemo(() => {
        if (isSpacePanning || (dragRef.current && !dragRef.current.isSpaceInitiated)) {
            return dragRef.current ? 'grabbing' : 'grab';
        }
        if (placementMode === 'eraser') {
            return 'crosshair';
        }
        if (placementMode) {
            return 'pointer'; // Simple pointer for wall/piece placement
        }
        return 'grab'; // Default pannable cursor
    }, [isSpacePanning, placementMode, eraserShape]);

    return {
        cellSize,
        center,
        viewport,
        hoverPosition,
        isBoardMoving,
        isPenDrawing,
        selectionStart,
        isSpacePanning,
        cursorStyle,
        // Event Handlers
        onMouseDown,
        onMouseMove: (isSpacePanning || !!dragRef.current || isPenDrawing || !!selectionStart || !!placementMode) ? onMouseMove : undefined,
        onMouseUp,
        onWheel,
    };
} 