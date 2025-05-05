const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000; // Frontend server će slušati na ovom portu

// Serve static files from the React build direktorija
app.use(express.static(path.join(__dirname, 'build')));

// API proxy za backend zahtjeve koji počinju s /api
app.use('/api', async (req, res) => {
  try {
    // Adresa tvog backend servera koji radi na ISTOJ mašini (VM)
    const backendUrl = 'http://localhost:5001'; 

    // Kreiraj URL za backend tako što ćeš ukloniti '/api' s početka originalnog URL-a
    // Npr. ako je zahtjev došao na /api/auth/login, targetUrl će biti /auth/login
    const targetUrl = req.originalUrl.replace(/^\/api/, ''); 

    console.log(`Proxying request: ${req.method} ${req.originalUrl} -> ${backendUrl}${targetUrl}`); // Logiranje

    // Prosljeđivanje headera - osnovno pročišćavanje
    const headersToSend = { ...req.headers };
    // Ukloni 'host' header jer će axios postaviti ispravan za localhost:5001
    delete headersToSend['host']; 
    // Možeš dodati ili ukloniti još headera po potrebi

    const response = await axios({
      method: req.method,
      url: `${backendUrl}${targetUrl}`, // Koristi ispravno konstruiran URL
      data: req.body,       // Proslijedi tijelo zahtjeva (za POST, PUT, itd.)
      headers: headersToSend, // Proslijedi pročišćene headere
      // Važno za binarne podatke ili specifične content-types:
      responseType: 'stream' // Počni sa streamom za fleksibilnost
    });

    // Proslijedi status i headere s backenda na frontend
    res.status(response.status);
    // Filtriraj headere koje ćeš proslijediti klijentu
    Object.keys(response.headers).forEach(key => {
        // Možeš dodati logiku za filtriranje headera ako je potrebno
        // Npr. izbjegavaj slanje 'transfer-encoding', 'connection' itd. ako uzrokuju probleme
        if (key.toLowerCase() !== 'transfer-encoding' && key.toLowerCase() !== 'connection') {
             res.setHeader(key, response.headers[key]);
        }
    });

    // Proslijedi tijelo odgovora (stream) s backenda na frontend
    response.data.pipe(res);

  } catch (error) {
    // Logiraj detaljnije greške na serveru radi lakšeg debugiranja
    console.error("API Proxy Error:", error.message); 
    if (error.response) {
        // Greška je došla kao odgovor od backenda
        console.error("Backend Response Status:", error.response.status);
        console.error("Backend Response Data:", error.response.data);
        // Pokušaj poslati originalni status i poruku backenda
        res.status(error.response.status).send(error.response.data || 'Error from backend');
    } else if (error.request) {
        // Zahtjev je poslan, ali odgovor nije primljen od backenda
        console.error("No response received from backend.");
        res.status(504).send('Gateway Timeout - No response from backend server.'); // 504 Gateway Timeout
    } else {
        // Greška prilikom postavljanja zahtjeva
        console.error('Error setting up request:', error.message);
        res.status(500).send('Internal Server Error - Proxy setup failed');
    }
  }
});

// --- Ostatak tvog koda za specijalne rute i fallback ostaje isti ---

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

// Special route for standalone daily schedule (raspored letova)
app.get('/rl', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'rl.html'));
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
    userAgent.match(/Web0S/i) ||
    userAgent.match(/VIDAA/i) ||
    userAgent.match(/Viera/i);
  
  // Check if it's specifically WebOS 4.x
  const isWebOS4 = 
    (userAgent.match(/WebOS\s*4/i) || 
     userAgent.match(/Web0S\s*4/i) ||
     userAgent.match(/webosbrowser\/4/i) ||
     // LG 55UK6300MLB is known to be WebOS 4.x
     userAgent.match(/55UK6300/i));
  
  // If it's a TV browser and accessing a public page, redirect to the TV version
  if ((isTVBrowser || isWebOS4) && 
      (req.path.includes('/public-daily-schedule') || 
       req.path.includes('/public/'))) {
    console.log('TV browser detected, redirecting to TV-optimized version');
    res.sendFile(path.join(__dirname, 'build', 'tv-redirect.html'));
  } else {
    next();
  }
});

// Fallback route za sve ostale zahtjeve servira buildani index.html (za React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server (serving build + API proxy) is running on port ${PORT}`);
});