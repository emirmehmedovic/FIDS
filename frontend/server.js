const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'build')));

// API proxy for backend requests
app.use('/api', async (req, res) => {
  try {
    const backendUrl = 'https://fids-hqlz.onrender.com';
    const response = await axios({
      method: req.method,
      url: `${backendUrl}${req.url}`,
      data: req.body,
      headers: req.headers
    });
    res.status(response.status).send(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).send(error.response?.data || 'Error proxying request');
  }
});

// Special route for public daily schedule
app.get('/public-daily-schedule', (req, res) => {
  // Read the pre-rendered HTML template
  let html = fs.readFileSync(path.join(__dirname, 'build', 'index.html'), 'utf8');
  
  // Inject meta tags for TV compatibility
  html = html.replace(
    '<head>',
    `<head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <script>
      // Polyfill for older browsers
      if (!window.Promise) {
        document.write('<script src="https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js"><\\/script>');
      }
      if (!window.fetch) {
        document.write('<script src="https://cdn.jsdelivr.net/npm/whatwg-fetch@3.6.2/dist/fetch.umd.js"><\\/script>');
      }
    </script>`
  );
  
  res.send(html);
});

// Special route for public display pages
app.get('/public/:pageId', (req, res) => {
  // Read the pre-rendered HTML template
  let html = fs.readFileSync(path.join(__dirname, 'build', 'index.html'), 'utf8');
  
  // Inject meta tags for TV compatibility
  html = html.replace(
    '<head>',
    `<head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <script>
      // Polyfill for older browsers
      if (!window.Promise) {
        document.write('<script src="https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js"><\\/script>');
      }
      if (!window.fetch) {
        document.write('<script src="https://cdn.jsdelivr.net/npm/whatwg-fetch@3.6.2/dist/fetch.umd.js"><\\/script>');
      }
      
      // Store the pageId for the React app to use
      window.INITIAL_PAGE_ID = "${req.params.pageId}";
    </script>`
  );
  
  res.send(html);
});

// Special route for TV browsers
app.get('/tv-redirect', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'tv-redirect.html'));
});

// Route for detecting TV browsers and redirecting them
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // Check if it's a TV browser
  const isTVBrowser = 
    userAgent.match(/TV/i) ||
    userAgent.match(/SmartTV/i) ||
    userAgent.match(/HbbTV/i) ||
    userAgent.match(/NetCast/i) ||
    userAgent.match(/SMART-TV/i) ||
    userAgent.match(/Tizen/i) ||
    userAgent.match(/WebOS/i) ||
    userAgent.match(/VIDAA/i) ||
    userAgent.match(/Viera/i);
  
  // If it's a TV browser and accessing a public page, redirect to the TV version
  if (isTVBrowser && 
      (req.path.includes('/public-daily-schedule') || 
       req.path.includes('/public/'))) {
    res.sendFile(path.join(__dirname, 'build', 'tv-redirect.html'));
  } else {
    next();
  }
});

// Fallback route for all other requests to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
