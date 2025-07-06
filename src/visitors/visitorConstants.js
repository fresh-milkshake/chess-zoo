export const VisitorState = {
  IDLE: 'IDLE', // Doing nothing, deciding what to do next
  SELECTING_TARGET: 'SELECTING_TARGET', // Choosing a piece to watch
  MOVING_TO_TARGET: 'MOVING_TO_TARGET', // Walking towards the chosen piece's viewing spot
  OBSERVING: 'OBSERVING', // Standing still and watching the piece
  COMMENTING: 'COMMENTING', // Displaying a comment bubble
  WANDERING: 'WANDERING', // Moving randomly if no target is found
};

export const VISITOR_SPEED = 0.05; // Units per simulation step
export const VIEWING_DISTANCE = 5; // Preferred distance from the target piece
export const TARGETING_RANGE = 15; // Max distance to look for pieces
export const MIN_STATE_DURATION = 2000; // Min ms in a state like OBSERVING/COMMENTING
export const MAX_STATE_DURATION = 10000; // Max ms in a state like OBSERVING/COMMENTING
export const COMMENT_DURATION = 3000; // How long comment is visible (ms) 