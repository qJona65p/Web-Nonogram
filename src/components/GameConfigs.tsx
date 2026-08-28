import { useState } from "react";
import { useGame } from "../ctx/gameCtx";

const PANEL_WIDTH = "18rem";

export default function GameConfigs() {
    const { onGenerateGame } = useGame();

    const [sizex, setSizex] = useState(10);
    const [sizey, setSizey] = useState(10);
    const [difficulty, setDifficulty] = useState(5);

    const [open, setOpen] = useState(true);

    return(
        <div className="relative shrink-0 self-stretch">
            {/* Sliding panel */}
            <div
                className="h-full overflow-hidden transition-[width] duration-300 ease-out"
                style={{ width: open ? PANEL_WIDTH : "0rem" }}
            >
                <div className="h-full rounded-xl border border-border bg-bg p-6 shadow-[var(--shadow)]" style={{ width: PANEL_WIDTH }}>
                    <h2 className="mb-5 text-base font-semibold text-text-h">Game settings</h2>
                    
                    <div className="space-y-5">
                        <SliderField label="Width" value={sizex} min={3} max={50} onChange={setSizex} />
                        <SliderField label="Height" value={sizey} min={3} max={50} onChange={setSizey} />
                        <SliderField label="Difficulty" value={difficulty} min={0} max={10} onChange={setDifficulty} />
                    </div>

                    <button
                        onClick={() => onGenerateGame(sizex, sizey, difficulty / 10)}
                        className="mt-6 w-full cursor-pointer rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
                    >Generate game</button>
                </div>
            </div>
            {/* Pull tab */}
            <button
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? "Hide game settings" : "Show game settings"}
                aria-expanded={open}
                className="absolute top-1/2 z-10 flex h-16 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-r-lg border border-l-0 border-border bg-bg text-text shadow-[var(--shadow)] transition-[left] duration-300 ease-out hover:bg-accent-bg hover:text-accent"
                style={{ left: open ? PANEL_WIDTH : "0rem" }}
            >
                <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </button>
        </div>
    );
}

interface SliderFieldProps {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (v: number) => void;
}

function SliderField({ label, value, min, max, onChange }: SliderFieldProps) {
    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm text-text">{label}</label>
                <span className="rounded-md bg-code-bg px-2 py-0.5 text-xs font-medium tabular-nums text-text-h">
                    {value}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(e.target.valueAsNumber)}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border"
            />
        </div>
    );
}