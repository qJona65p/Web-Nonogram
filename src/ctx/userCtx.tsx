'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface UserCtxProps {
    username: string | null;
    login: (inputusername: string) => void;
    logout: () => void;
    lives: number;
    loseLive: () => void
}

const AuthContext = createContext<UserCtxProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [username, setUsername] = useState<string | null>(null);
    const [lives, setLives] = useState(5);

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

    const loseLive = () => setLives(lives - 1);

    return (
        <AuthContext.Provider value={{ username, login, logout, lives, loseLive }}>
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