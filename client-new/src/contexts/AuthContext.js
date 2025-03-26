import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [user, setUser] = useState(null);

    const login = async (credentials) => {
        try {
            // Implement login logic here
            setIsAuthenticated(true);
            // Check if user is admin and set isAdmin accordingly
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUser(null);
        // Additional logout logic (e.g., clearing tokens)
    };

    const register = async (userData) => {
        try {
            // Implement registration logic here
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider 
            value={{
                isAuthenticated,
                isAdmin,
                user,
                login,
                logout,
                register
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
