// Environment-based configuration
// We no longer need these specific checks as REACT_APP_API_URL will handle different environments
// const isDevelopment = process.env.NODE_ENV === 'development';
// console.log('Environment:', process.env.NODE_ENV);
// console.log('Is development:', isDevelopment);

// const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
// const isLocalhost = typeof window !== 'undefined' &&
//  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
// console.log('Is Vercel:', isVercel);
// console.log('Is Localhost:', isLocalhost);

// Configuration object
const config = {
  // API URL - Use the environment variable if available, otherwise default to localhost for local dev
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5001',
};

console.log('Using API URL:', config.apiUrl);

export default config;
