// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development';
console.log('Environment:', process.env.NODE_ENV);
console.log('Is development:', isDevelopment);

// For Vercel deployment, we always want to use the production URL
const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
// Check if we're running on localhost
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
console.log('Is Vercel:', isVercel);
console.log('Is Localhost:', isLocalhost);

// Configuration object
const config = {
  // API URL - use localhost when running locally or in development, Render URL in production
  apiUrl: isLocalhost || isDevelopment
    ? 'http://localhost:5001'
    : 'https://fids-hqlz.onrender.com', // Render.com backend URL
};

console.log('Using API URL:', config.apiUrl);

export default config;
