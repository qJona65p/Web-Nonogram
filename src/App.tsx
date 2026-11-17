import Login from "./components/Login";
import { useAuth } from "./ctx/userCtx";
import GameConfigs from "./components/GameConfigs";
import PuzzleGrid from "./components/PuzzleGrid";
import { useGame } from "./ctx/gameCtx";

export default function App() {
    const { username } = useAuth();
    const { game, board } = useGame();

    if (username == null) return <Login />;

    if (game == null || board == null) {
        return (
            <main className="flex flex-1 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
            </main>
        );
    }

    return (
        <main className="mx-auto flex w-full flex-1 flex-col sm:flex-row sm:items-stretch">
            <GameConfigs />
            <section className="flex min-h-0 flex-1 items-start justify-center overflow-auto py-2 [scrollbar-gutter:stable]">
                <PuzzleGrid board={board} />
            </section>
        </main>
    )
}
