// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development';
console.log('Environment:', process.env.NODE_ENV);
console.log('Is development:', isDevelopment);

// For Vercel deployment, we always want to use the production URL
const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
console.log('Is Vercel:', isVercel);

// Configuration object
const config = {
  // API URL - use localhost in development, Render URL in production
  apiUrl: isVercel || !isDevelopment
    ? 'https://fids-hqlz.onrender.com' // Render.com backend URL
    : 'http://localhost:5001',
};

console.log('Using API URL:', config.apiUrl);

export default config;
