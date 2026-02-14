import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserData } from '../types/user';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface AuthContextType {
    user: UserData | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (userData: UserData, token: string) => void;
    logout: () => void;
    refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useLocalStorage<UserData | null>('user', null);
    const [token, setToken] = useLocalStorage<string | null>('auth', null);
    const [, setSelectedRegionId] = useLocalStorage<string | null>('selectedRegionId', null);
    const [, setSelectedLanguageId] = useLocalStorage<string | null>('selectedLanguageId', null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);

    useEffect(() => {
        setIsAuthenticated(!!token);
    }, [token]);

    const login = (userData: UserData, userToken: string) => {
        setUser(userData);
        setToken(userToken);
        setIsAuthenticated(true);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setSelectedRegionId(null);
        setSelectedLanguageId(null);
        setIsAuthenticated(false);
    };

    const refreshUser = () => {
        // useLocalStorage already keeps 'user' in sync
    };

    // useLocalStorage handles synchronization across tabs

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
