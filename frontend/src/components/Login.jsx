import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { FiUser, FiLock, FiLogIn } from 'react-icons/fi';
import config from '../config';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Animation effect for login form
  useEffect(() => {
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
      setTimeout(() => {
        loginForm.classList.add('form-visible');
      }, 300);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${config.apiUrl}/api/auth/login`, { username, password });
      const { token, user } = response.data;
      
      // Add token to user object
      const userData = { ...user, token };
      
      // Login user through AuthProvider
      login(userData);
      
      // Show success animation before navigating
      const loginForm = document.querySelector('.login-form');
      loginForm.classList.add('form-success');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (err) {
      setError('Pogrešno korisničko ime ili lozinka');
      console.error('Greška prilikom prijave:', err);
      setIsLoading(false);
      
      // Show error animation
      const loginForm = document.querySelector('.login-form');
      loginForm.classList.add('form-error');
      setTimeout(() => {
        loginForm.classList.remove('form-error');
      }, 500);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-shape"></div>
        <div className="login-shape"></div>
      </div>
      
      <div className="login-content">
        <img
          src="/SkyLine logo.png"
          alt="SkyLine Logo"
          className="login-logo"
        />
        
        <h1 className="login-title">Dobrodošli nazad</h1>
        <p className="login-subtitle">Prijavite se za nastavak u SkyLine FIDS</p>
        
        {error && (
          <div className="login-error">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form glassmorphism">
          <div className="login-form-group">
            <label className="login-label">
              <FiUser className="login-icon" />
              <span>Korisničko ime</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              placeholder="Enter your username"
              required
            />
          </div>
          
          <div className="login-form-group">
            <label className="login-label">
              <FiLock className="login-icon" />
              <span>Lozinka</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                <FiLogIn className="login-button-icon" />
                <span>Prijavi se</span>
              </>
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <p>SkyLine Flight Management System © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
