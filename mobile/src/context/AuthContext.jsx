import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        isLoggedIn();
    }, []);

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let userToken = await AsyncStorage.getItem('userToken');
            setToken(userToken);
            setIsLoading(false);
        } catch (e) {
            console.log(`isLoggedIn error ${e}`);
            setIsLoading(false);
        }
    };

    const login = async (userToken) => {
        setIsLoading(true);
        setToken(userToken);
        AsyncStorage.setItem('userToken', userToken);
        setIsLoading(false);
    };

    const logout = () => {
        setIsLoading(true);
        setToken(null);
        AsyncStorage.removeItem('userToken');
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ login, logout, isLoading, token }}>
            {children}
        </AuthContext.Provider>
    );
};
