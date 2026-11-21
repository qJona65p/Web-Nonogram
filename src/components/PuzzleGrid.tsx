import { useLayoutEffect, useRef, useState } from "react";
import Board, { type HoveredCell } from "./Board";
import SideNumbers from "./SideNumbers";
import UpperNumbers from "./UpperNumbers";
import GameHud from "./GameHud";
import { useGame } from "../ctx/gameCtx";

interface PuzzleGridProps {
    board: (boolean | null)[][];
}

// Keep cells readable; when the puzzle does not fit at this size the whole
// grid scrolls instead of shrinking the clues into illegibility.
const MIN_CELL = 16;
const MAX_CELL = 72;
const BOTTOM_MARGIN = 16;

// Approximate footprint of one clue number relative to the cell size. The
// gutters use the same cell tracks as the board, so only the space they
// reserve for sizing needs to be estimated here.
const CLUE_WIDTH_SCALE = 0.55;
const CLUE_HEIGHT_SCALE = 0.8;
const LAYOUT_GAP = 4;

export default function PuzzleGrid({ board }: PuzzleGridProps) {
    const { sizex, sizey, sidenums } = useGame();

    const containerRef = useRef<HTMLDivElement>(null);

    const [cell, setCell] = useState(24);
    const [hovered, setHovered] = useState<HoveredCell | null>(null);

    const maxRowClues = sidenums == null
        ? 1
        : Math.max(1, ...sidenums.Right.map((runs) => runs.length));
    const maxColClues = sidenums == null
        ? 1
        : Math.max(1, ...sidenums.Up.map((runs) => runs.length));

    useLayoutEffect(() => {
        function recalc() {
            if (sizex == null || sizey == null) return;

            const container = containerRef.current;
            if (!container) return;

            const availableW = container.clientWidth - LAYOUT_GAP;
            const top = container.getBoundingClientRect().top;
            const availableH = Math.max(window.innerHeight - top - BOTTOM_MARGIN, 240) - LAYOUT_GAP;

            // sizex = rows, sizey = columns. Solve for one square cell while
            // reserving roughly the space each clue gutter needs.
            const byWidth = availableW / (sizey + maxRowClues * CLUE_WIDTH_SCALE);
            const byHeight = availableH / (sizex + maxColClues * CLUE_HEIGHT_SCALE);

            const next = Math.floor(Math.min(byWidth, byHeight));
            setCell(Math.min(MAX_CELL, Math.max(MIN_CELL, next)));
        }

        recalc();

        const observer = new ResizeObserver(recalc);
        if (containerRef.current) observer.observe(containerRef.current);
        window.addEventListener("resize", recalc);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", recalc);
        };
    }, [sizex, sizey, maxRowClues, maxColClues]);

    // Ignore a hovered coordinate left over from a different board size.
    const activeHover =
        hovered != null &&
        sizex != null &&
        sizey != null &&
        hovered.x >= 0 &&
        hovered.y >= 0 &&
        hovered.x < sizex &&
        hovered.y < sizey
            ? hovered
            : null;

    return (
        <div ref={containerRef} className="w-full">
            <div className="mx-auto w-max">
                <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: "auto auto", gridTemplateRows: "auto auto" }}
                >
                    <GameHud />
                    <div className="self-end">
                        <UpperNumbers cell={cell} hoveredCol={activeHover?.y ?? null} />
                    </div>
                    <SideNumbers cell={cell} hoveredRow={activeHover?.x ?? null} />
                    <Board
                        board={board}
                        cell={cell}
                        hovered={activeHover}
                        onHover={setHovered}
                    />
                </div>
            </div>
        </div>
    );
}
