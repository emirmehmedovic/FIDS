import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import config from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Standardizacija: koristimo jedan ključ 'token' za spremanje tokena
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));

      if (!token || !userData) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${config.apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Kombinujte podatke sa backend-a s lokalno sačuvanim tokenom
        const updatedUser = { 
          ...response.data, 
          token // Dodajte token iz localStorage-a
        };
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser)); // Ažurirajte podatke
      } catch (err) {
        console.error('Greška pri provjeri tokena:', err);
        logout();
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (userData) => {
    console.log('AuthProvider login called with:', userData);
    
    if (!userData?.token) {
      console.error('Neispravni korisnički podaci:', userData);
      return;
    }

    // Standardizacija: koristimo jedan ključ 'token' za spremanje tokena
    console.log('Storing token in localStorage:', userData.token);
    localStorage.setItem('token', userData.token);
    
    console.log('Storing user data in localStorage');
    localStorage.setItem('user', JSON.stringify(userData));
    
    console.log('Setting user state');
    setUser(userData);
    
    console.log('Login complete');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Očistimo sve moguće ključeve iz prethodnih implementacija
    localStorage.removeItem('authToken');
  };

  // Vraćamo loading stanje kako bismo znali kada je provjera tokena završena
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Eksportujte useAuth hook
export const useAuth = () => {
  return useContext(AuthContext);
};
