import { useGame } from "../ctx/gameCtx";
import { difficultyLabel } from "../lib/funcs";
import Status from "./Status";
import GameTimer from "./GameTimer";

/**
 * The corner HUD: lives, elapsed time and a compact line of puzzle metadata.
 * It sits in the top-left cell of the puzzle grid, above the side clues, and
 * is centered in that cell so it stays balanced at every board size.
 */
export default function GameHud() {
    const { game } = useGame();

    if (game == null) return null;

    return (
        <div className="flex flex-col items-end justify-end">
            <div className="flex flex-col items-center justify-end gap-1 text-center pb-2">
                <Status />
                <GameTimer startedAt={game.startedAt} endedAt={game.endedAt} />
                <div className="flex flex-col items-center gap-0.5 text-[11px] leading-tight text-text">
                    <span className="tabular-nums">
                        {game.sizex}×{game.sizey} · {difficultyLabel(game.difficulty)} ({game.difficulty})
                    </span>
                    {game.livesLost > 0 && (
                        <span
                            className="font-semibold text-accent"
                            title="Lives lost by all players in this puzzle"
                        >
                            {game.livesLost} {game.livesLost === 1 ? "life" : "lives"} lost
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
