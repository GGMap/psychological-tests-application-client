import {createContext, useState, useContext, useEffect} from 'react';
import {jwtDecode} from 'jwt-decode'

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({children}) => {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('jwt_token');
        if (storedToken) {
            try {
                const decoded = jwtDecode(storedToken);
                setToken(storedToken);
                setUser({
                    id: decoded.id,
                    email: decoded.sub,
                    role: decoded.role,
                    isActive: decoded.is_active,
                })
            } catch (error) {
                console.error('Ошибка декодирования токена:', error);
                localStorage.removeItem('jwt_token');
            }
        }
        setLoading(false);
    }, []);

    const login = (newToken) => {
        localStorage.setItem('jwt_token', newToken);
        setToken(newToken);

        try {
            const decoded = jwtDecode(newToken);
            setUser({
                id: decoded.id,
                email: decoded.sub,
                role: decoded.role,
                isActive: decoded.is_active,
            })
            console.log(decoded)
        } catch (error) {
            console.error('Ошибка декодирования токена:', error);
        }
    };

    const logout = () => {
        localStorage.removeItem('jwt_token');
        setToken(null);
        setUser(null);
    }

    const value = {
        token,
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
        isSuperAdmin: user?.role === 'SUPER',
        isStandardAdmin: user?.role === 'STANDARD'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};