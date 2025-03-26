import React, { createContext, useContext, useState } from 'react';
import axios from '../config/axios';

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

    const register = async (fullName, email, phone) => {
        try {
            const response = await axios.post('/register', {
                fullName,
                email,
                phone
            });

            // Actualizar el estado del usuario si es necesario
            setUser({
                id: response.data.id,
                name: fullName,
                email: email,
                points: response.data.points
            });

            return response.data;
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
