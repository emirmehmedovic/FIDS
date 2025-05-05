const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000; // Frontend server će slušati na ovom portu

// Serve static files from the React build direktorija
app.use(express.static(path.join(__dirname, 'build')));

// Omogućava server.js-u da čita JSON tijelo iz dolaznih zahtjeva
app.use(express.json());

// API proxy za backend zahtjeve koji počinju s /api
app.use('/api', async (req, res) => {
  const backendUrl = 'http://localhost:5001'; 
  const targetUrl = req.originalUrl;
  console.log(`[PROXY REQ] ${req.method} ${req.originalUrl} -> ${backendUrl}${targetUrl}`); // Logiranje
  
  const headersToSend = { ...req.headers };
  delete headersToSend['host']; 
  // Dodaj X-Forwarded-For da backend zna originalnu IP adresu klijenta
  headersToSend['X-Forwarded-For'] = req.ip; 

  try {
    const response = await axios({
      method: req.method,
      url: `${backendUrl}${targetUrl}`, // Koristi ispravno konstruiran URL
      data: req.body,       // Proslijedi tijelo zahtjeva (za POST, PUT, itd.)
      headers: headersToSend, // Proslijedi pročišćene headere
      responseType: 'stream', // Počni sa streamom za fleksibilnost
      timeout: 30000 // Povećano na 30 sekundi
    });

    console.log(`[PROXY RES] Backend status: ${response.status} for ${targetUrl}`); // Logiraj status odgovora

    // Proslijedi status i headere s backenda na frontend
    res.status(response.status);
    Object.keys(response.headers).forEach(key => {
        // Možeš dodati logiku za filtriranje headera ako je potrebno
        // Npr. izbjegavaj slanje 'transfer-encoding', 'connection' itd. ako uzrokuju probleme
        if (key.toLowerCase() !== 'transfer-encoding' && key.toLowerCase() !== 'connection') {
             res.setHeader(key, response.headers[key]);
        }
    });

    // Proslijedi tijelo odgovora (stream) s backenda na frontend
    response.data.pipe(res);
    console.log(`[PROXY RES] Response stream piped for ${targetUrl}`); // Logiraj da je stream poslan

  } catch (error) {
    // Logiraj detaljnije greške na serveru radi lakšeg debugiranja
    console.error(`[PROXY ERR] Error for ${req.method} ${targetUrl}:`, error.message); 
    if (error.response) {
      // Greška je došla kao odgovor od backenda
      const status = error.response.status;
      const responseData = error.response.data; // Get the data

      console.error("[PROXY ERR] Backend Response Status:", status);

      // Postavi status i headere od backenda ako su dostupni
      res.status(status);
      Object.keys(error.response.headers || {}).forEach(key => {
          if (key.toLowerCase() !== 'transfer-encoding' && key.toLowerCase() !== 'connection' && key.toLowerCase() !== 'content-length') {
             res.setHeader(key, error.response.headers[key]);
          }
      });

      // Provjeri da li je responseData stream
      if (responseData && typeof responseData.pipe === 'function') {
        // Logiraj samo početak streama ako je moguće (teško standardno logirati sadržaj streama)
        console.error("[PROXY ERR] Backend Response Data is a Stream. Piping error response to client."); 
        responseData.pipe(res); // Proslijedi stream greške klijentu
      } else if (responseData) {
        // Ako nije stream, pokušaj poslati kao JSON ili tekst
        // Logiraj samo dio podataka ako su preveliki
        const responseDataSample = JSON.stringify(responseData).substring(0, 200); 
        console.error("[PROXY ERR] Backend Response Data Sample:", responseDataSample);
        res.send(responseData); 
      } else {
        // Ako nema podataka, pošalji samo status
        console.error("[PROXY ERR] Backend Response has no data.");
        res.sendStatus(status);
      }

    } else if (error.request) {
        // Zahtjev je poslan, ali odgovor nije primljen od backenda
        console.error("[PROXY ERR] No response received from backend.");
         // Provjeri je li timeout greška
        if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
             console.error("[PROXY ERR] Request to backend timed out (axios timeout).");
             res.status(504).send('Gateway Timeout - Backend server did not respond in time.');
        } else {
             // Druge greške bez odgovora (npr. ECONNREFUSED)
             res.status(504).send('Gateway Timeout - Could not connect to backend server.'); 
        }
    } else {
        // Greška prilikom postavljanja zahtjeva
        console.error('[PROXY ERR] Error setting up request:', error.message);
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