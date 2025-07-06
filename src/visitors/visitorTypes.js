import { VisitorState } from './visitorConstants';

/**
 * Represents a visitor in the zoo.
 * @typedef {object} Visitor
 * @property {string} id - Unique identifier.
 * @property {number} x - X coordinate (can be float for smooth movement).
 * @property {number} y - Y coordinate (can be float).
 * @property {number} row - Grid row coordinate (integer).
 * @property {number} col - Grid column coordinate (integer).
 * @property {string} state - Current state (from VisitorState).
 * @property {string|null} targetPieceId - ID of the piece being watched.
 * @property {{row: number, col: number}|null} movementTarget - Target grid cell for movement.
 * @property {object} appearance - Parameters for procedural generation.
 * @property {string} appearance.color - Body color.
 * @property {number} appearance.headRadius - Radius of the head.
 * @property {number} appearance.bodyLength - Length of the body.
 * @property {number} appearance.legLength - Length of the legs.
 * @property {number} appearance.armLength - Length of the arms.
 * @property {string|null} currentComment - Text being displayed.
 * @property {boolean} isChild - Whether the visitor is a child (smaller).
 * @property {number} stateTimer - Timestamp when the current state should end or be re-evaluated.
 * @property {number|null} commentTimer - Timestamp when the current comment should disappear.
 * @property {Array<{row: number, col: number}> | null} currentPath - Current path visitor is following.
 */ 