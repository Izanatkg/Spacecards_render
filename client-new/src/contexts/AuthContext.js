import React, { createContext, useContext, useState } from 'react';
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
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const register = async (name, email, phone) => {
        try {
            const response = await axios.post(`${API_URL}/register`, {
                name,
                email,
                phone
            });
            setUser(response.data);
            return response.data;
        } catch (error) {
            console.error('Error during registration:', error);
            throw error;
        }
    };

    const value = {
        user,
        setUser,
        loading,
        setLoading,
        register
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;