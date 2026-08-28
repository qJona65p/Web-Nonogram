'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export const MAX_LIVES = 5;

interface UserCtxProps {
    username: string | null;
    login: (inputusername: string) => void;
    logout: () => void;
    lives: number;
    loseLive: () => void;
    resetLives: () => void;
}

const AuthContext = createContext<UserCtxProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [username, setUsername] = useState<string | null>(null);
    const [lives, setLives] = useState(MAX_LIVES);

    // Load username from localStorage on initial mount
    useEffect(() => {
        const savedUsername = localStorage.getItem('username');
        if (savedUsername) setUsername(savedUsername);
    }, []);

    const login = (inputToken: string) => {
        localStorage.setItem('username', inputToken.trim());
        setUsername(inputToken.trim());
    };

    const logout = () => {
        localStorage.removeItem('username');
        setUsername(null);
    };

    const loseLive = () => setLives((l) => Math.max(l - 1, 0));

    const resetLives = () => setLives(MAX_LIVES);

    return (
        <AuthContext.Provider value={{ username, login, logout, lives, loseLive, resetLives }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}