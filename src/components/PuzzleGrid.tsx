import { useLayoutEffect, useRef, useState } from "react";
import Board from "./Board";
import SideNumbers from "./SideNumbers";
import UpperNumbers from "./UpperNumbers";
import type { Game, SideNums } from "../lib/types";

interface PuzzleGridProps {
    game: Game;
    sidenums: SideNums;
}

const MIN_CELL = 8;
const MAX_CELL = 72;
const BOTTOM_MARGIN = 16;

export default function PuzzleGrid({ game, sidenums }: PuzzleGridProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const upperRef = useRef<HTMLDivElement>(null);
    const sideRef = useRef<HTMLDivElement>(null);

    const [cell, setCell] = useState(24);

    useLayoutEffect(() => {
        function recalc() {
            const container = containerRef.current;
            const upper = upperRef.current;
            const side = sideRef.current;
            if (!container || !upper || !side) return;

            // Space actually available for the puzzle, before subtracting the number gutters.
            const availableW = container.clientWidth;
            const top = container.getBoundingClientRect().top;
            const availableH = Math.max(window.innerHeight - top - BOTTOM_MARGIN, 240);

            // The number gutters size themselves off their own text content (not off `cell`),
            // so this measurement is stable and doesn't feed back into itself.
            const gutterW = side.offsetWidth;
            const gutterH = upper.offsetHeight;

            const boardW = availableW - gutterW;
            const boardH = availableH - gutterH;

            const next = Math.floor(Math.min(boardW / game.sizex, boardH / game.sizey));
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
    }, [game.sizex, game.sizey]);

    return (
        <div ref={containerRef} className="flex w-full justify-center">
            <div
                className="grid gap-1"
                style={{ gridTemplateColumns: "auto auto", gridTemplateRows: "auto auto" }}
            >
                <div />
                <div ref={upperRef} className="self-end">
                    <UpperNumbers sizey={game.sizey} Items={sidenums.Up} cell={cell} />
                </div>
                <div ref={sideRef} className="justify-self-end">
                    <SideNumbers sizex={game.sizex} Items={sidenums.Right} cell={cell} />
                </div>
                <Board game={game} cell={cell} />
            </div>
        </div>
    );
}
