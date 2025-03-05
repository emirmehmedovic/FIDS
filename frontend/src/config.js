// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development';

// Configuration object
const config = {
  // API URL - use localhost in development, Render URL in production
  apiUrl: isDevelopment 
    ? 'http://localhost:5001' 
    : 'https://fids-hqlz.onrender.com', // Render.com backend URL
};

export default config;
