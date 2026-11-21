/**
 * Game rules shared by the UI and the data layer.
 *
 * The `games` table defaults and `reset_game`'s difficulty clamp mirror these
 * numbers, so update the SQL when changing them. The UI derives its slider
 * ranges and the bootstrap defaults from these values directly.
 */

export const MAX_LIVES = 5;

// Board size, used by the settings sliders, the clamp and the bootstrap.
export const MIN_BOARD_SIZE = 3;
export const MAX_BOARD_SIZE = 50;
export const DEFAULT_BOARD_SIZE = 10;

// Difficulty is a slider value; the generator maps it onto a 0-1 input.
export const MIN_DIFFICULTY = 0;
export const MAX_DIFFICULTY = 10;
export const DEFAULT_DIFFICULTY = 5;
