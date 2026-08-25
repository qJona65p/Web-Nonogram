interface GameConfigsProps {
    sizex: number;
    setSizex: (e: number) => void;
    sizey: number;
    setSizey: (e: number) => void;
    difficulty: number;
    setDifficulty: (e: number) => void;
    onGenerateGame: () => void;
}

export default function GameConfigs({ sizex, setSizex, sizey, setSizey, difficulty, setDifficulty, onGenerateGame }: GameConfigsProps) {
    return(
        <aside className="w-full h-full shrink-0 sm:w-72">
            <div className="sticky top-24 rounded-2xl border border-border bg-bg p-6 shadow-[var(--shadow)]">
                <h2 className="mb-5 text-base font-semibold text-text-h">Game settings</h2>
                
                <div className="space-y-5">
                    <SliderField label="Width" value={sizex} min={3} max={50} onChange={setSizex} />
                    <SliderField label="Height" value={sizey} min={3} max={50} onChange={setSizey} />
                    <SliderField label="Difficulty" value={difficulty} min={0} max={10} onChange={setDifficulty} />
                </div>

                <button
                    onClick={() => onGenerateGame()}
                    className="mt-6 w-full cursor-pointer rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
                >
                    Generate game
                </button>
            </div>
        </aside>
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