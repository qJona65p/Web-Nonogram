import { useState } from "react";
import { useAuth } from "../ctx/userCtx";
import { submitUsername } from "../lib/supabase";

export default function Login() {
    const { login } = useAuth();

    const [input, setInput] = useState<string>("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleLogin(e: React.SubmitEvent) {
        e.preventDefault();

        const username = input.trim();
        if (username == "" || busy) return;

        setBusy(true);
        setError(null);

        submitUsername(username)
            .then(() => login(username))
            .catch((err) => {
                console.error(err);
                setError("Could not sign in. Check your connection and try again.");
            })
            .finally(() => setBusy(false));
    }

    return (
        <main className="flex flex-1 items-center justify-center px-4">
            <form onSubmit={(e) => handleLogin(e)} className="w-full max-w-sm rounded-2xl border border-border bg-bg p-8 shadow-[var(--shadow)]">
                <h1 className="mb-1 text-lg font-semibold text-text-h">Nonograma Online</h1>
                <p className="mb-6 text-sm text-text">Enter a username to play together on the same board.</p>

                <label htmlFor="username" className="mb-1.5 block text-sm text-text">
                    Username
                </label>
                <input
                    type="text"
                    name="username"
                    id="username"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. pixel_painter"
                    className="mb-3 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-h outline-none transition-colors focus:border-accent-border"
                />

                {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}

                <button
                    type="submit"
                    disabled={busy}
                    className="w-full cursor-pointer rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.98] disabled:cursor-default disabled:opacity-60"
                >{busy ? "Joining…" : "Login"}</button>
            </form>
        </main>
    );
}
