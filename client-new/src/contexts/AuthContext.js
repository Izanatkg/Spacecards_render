import React, { createContext, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Get the API URL based on environment
const API_URL = process.env.NODE_ENV === 'production' 
    ? '' // Empty string means same domain in production
    : 'http://localhost:5000';

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const register = async (name, email, phone) => {
        try {
            const response = await axios.post('/api/register', {
                name,
                email,
                phone
            });
            return response.data;
        } catch (error) {
            console.error('Error during registration:', error);
            throw error;
        }
    };

    const value = {
        register
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;