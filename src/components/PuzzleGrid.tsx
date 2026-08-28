import { useLayoutEffect, useRef, useState } from "react";
import Board from "./Board";
import SideNumbers from "./SideNumbers";
import UpperNumbers from "./UpperNumbers";
import Status from "./Status";
import { useGame } from "../ctx/gameCtx";

interface PuzzleGridProps {
    playerGame: (boolean | null)[][];
}

const MIN_CELL = 8;
const MAX_CELL = 72;
const BOTTOM_MARGIN = 16;

export default function PuzzleGrid({ playerGame }: PuzzleGridProps) {
    const { sizex, sizey } = useGame();

    const containerRef = useRef<HTMLDivElement>(null);
    const upperRef = useRef<HTMLDivElement>(null);
    const sideRef = useRef<HTMLDivElement>(null);

    const [cell, setCell] = useState(24);

    useLayoutEffect(() => {
        function recalc() {
            if (sizex == null || sizey == null) return;
            
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

            const next = Math.floor(Math.min(boardW / sizex, boardH / sizey));
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
    }, [sizex, sizey]);

    return (
        <div ref={containerRef} className="flex w-full justify-center">
            <div
                className="grid gap-1"
                style={{ gridTemplateColumns: "auto auto", gridTemplateRows: "auto auto" }}
            >
                <Status />
                <div ref={upperRef} className="self-end">
                    <UpperNumbers cell={cell} />
                </div>
                <div ref={sideRef} className="justify-self-end">
                    <SideNumbers cell={cell} /> 
                </div>
                <Board playerGame={playerGame} cell={cell} />
            </div>
        </div>
    );
}
