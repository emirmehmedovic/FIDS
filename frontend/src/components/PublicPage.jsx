// Import polyfills and browser detection for TV compatibility
import '../polyfills';
import '../browser-detect';

import React from 'react';
import './PublicPage.css';
import config from '../config';

// WebOS specific polyfills
function padStart(str, targetLength, padString) {
  str = String(str);
  padString = padString || ' ';
  if (str.length >= targetLength) {
    return str;
  }
  var padding = padString;
  while (padding.length < targetLength - str.length) {
    padding += padString;
  }
  return padding.slice(0, targetLength - str.length) + str;
}

var PublicPage = function() {
  // Get pageId from URL
  function getPageIdFromUrl() {
    var pathParts = window.location.pathname.split('/');
    // Check if the URL contains 'public'
    for (var i = 0; i < pathParts.length; i++) {
      if (pathParts[i] === 'public' && i + 1 < pathParts.length) {
        return pathParts[i + 1];
      }
    }
    // Fallback to window.INITIAL_PAGE_ID if available (set by server.js)
    if (window.INITIAL_PAGE_ID) {
      return window.INITIAL_PAGE_ID;
    }
    return null;
  }
  
  var pageId = getPageIdFromUrl();
  
  var currentTimeState = React.useState(new Date());
  var currentTime = currentTimeState[0];
  var setCurrentTime = currentTimeState[1];
  
  var errorState = React.useState(null);
  var error = errorState[0];
  var setError = errorState[1];
  
  var staticContentState = React.useState(null);
  var staticContent = staticContentState[0];
  var setStaticContent = staticContentState[1];
  
  var sessionState = React.useState(null);
  var session = sessionState[0];
  var setSession = sessionState[1];

  React.useEffect(function() {
    function fetchData() {
      if (!pageId) return;

      // Fetch session data
      var sessionXhr = new XMLHttpRequest();
      sessionXhr.open('GET', config.apiUrl + '/api/display/active?page=' + pageId, true);
      sessionXhr.onreadystatechange = function() {
        if (sessionXhr.readyState === 4) {
          if (sessionXhr.status === 200) {
            try {
              var sessions = JSON.parse(sessionXhr.responseText);
              if (sessions.length > 0) {
                setSession(sessions[0]);
              } else {
                setSession(null);
              }
            } catch (err) {
              console.error('Greška pri parsiranju sesije:', err);
              setError('Greška pri parsiranju sesije');
            }
          } else {
            console.error('Greška pri dobavljanju sesije:', sessionXhr.status);
            setError('Greška pri dobavljanju sesije');
          }
        }
      };
      sessionXhr.send();

      // Fetch static content
      var staticXhr = new XMLHttpRequest();
      staticXhr.open('GET', config.apiUrl + '/api/content/page/' + pageId, true);
      staticXhr.onreadystatechange = function() {
        if (staticXhr.readyState === 4) {
          if (staticXhr.status === 200) {
            try {
              var staticData = JSON.parse(staticXhr.responseText);
              setStaticContent(staticData.content);
            } catch (err) {
              console.error('Greška pri parsiranju statičkog sadržaja:', err);
              // Ne postavljamo error jer ovo nije kritično
            }
          } else {
            console.error('Greška pri dobavljanju statičkog sadržaja:', staticXhr.status);
            // Ne postavljamo error jer ovo nije kritično
          }
        }
      };
      staticXhr.send();
    }

    // Inicijalno dohvaćanje podataka
    fetchData();
    
    // Automatsko osvježavanje svakih 2 minute (120000 ms)
    var refreshInterval = setInterval(function() {
      console.log('Osvježavanje podataka o sesiji...');
      fetchData();
    }, 120000);
    
    // Čišćenje intervala kada se komponenta unmount-a
    return function() { clearInterval(refreshInterval); };
  }, [pageId]);

  // Update time
  React.useEffect(function() {
    var timer = setInterval(function() {
      setCurrentTime(new Date());
    }, 1000);

    return function() { clearInterval(timer); };
  }, []);

  // Format date as DD.MM.YYYY
  function formatDate(date) {
    var day = padStart(date.getDate(), 2, '0');
    var month = padStart(date.getMonth() + 1, 2, '0');
    var year = date.getFullYear();
    return day + '.' + month + '.' + year;
  }

  // Format time as HH:MM
  function formatTime(date) {
    var hours = padStart(date.getHours(), 2, '0');
    var minutes = padStart(date.getMinutes(), 2, '0');
    return hours + ':' + minutes;
  }

  // Render error message if there is an error
  if (error) {
    return React.createElement('div', { className: 'default-content' }, [
      React.createElement('h1', {}, 'Greška prilikom učitavanja sesije'),
      React.createElement('p', {}, error)
    ]);
  }

  // Default content when no session is active
  if (!session || !session.Flight || !session.Flight.flight_number) {
    if (staticContent && staticContent.imageUrl) {
      return React.createElement('div', { className: 'default-content' }, 
        React.createElement('img', {
          src: config.apiUrl + staticContent.imageUrl,
          alt: 'Statički sadržaj',
          className: 'static-image'
        })
      );
    } else {
      return React.createElement('div', { className: 'default-content' }, [
        React.createElement('img', {
          src: '/SkyLine logo.png',
          alt: 'SkyLine Logo',
          className: 'logo',
          onError: function(e) { e.target.src = 'https://via.placeholder.com/300x100?text=SkyLine'; }
        }),
        React.createElement('h1', {}, 'Dobrodošli na Međunarodni Aerodrom Tuzla'),
        React.createElement('p', {}, 'Trenutno nema aktivnih sesija za prikaz')
      ]);
    }
  }

  // Format departure or arrival time
  var flightTime = session.Flight.is_departure 
    ? new Date(session.Flight.departure_time) 
    : new Date(session.Flight.arrival_time);
  
  var formattedFlightTime = formatTime(flightTime);

  // Create header elements
  var headerLeft = React.createElement('div', { className: 'header-left' }, [
    session.Flight.Airline && React.createElement('div', { className: 'airline-info' }, 
      session.Flight.Airline.logo_url && React.createElement('div', { className: 'logo-container' }, 
        React.createElement('img', {
          src: session.Flight.Airline.logo_url,
          alt: 'Airline Logo',
          className: 'airline-logo1',
          onError: function(e) { e.target.src = '/default-logo.png'; }
        })
      )
    ),
    React.createElement('span', { className: 'flight-number' }, session.Flight.flight_number)
  ]);

  var headerCenter = React.createElement('div', { className: 'header-center' }, 
    React.createElement('div', { className: 'airline-name' }, 
      session.Flight.Airline ? session.Flight.Airline.name : 'Unknown Airline'
    )
  );

  var headerRight = React.createElement('div', { className: 'header-right' }, [
    React.createElement('div', {}, React.createElement('h3', {}, 'DATUM I VRIJEME')),
    React.createElement('div', { className: 'current-time' }, formatTime(currentTime)),
    React.createElement('div', { className: 'current-date' }, formatDate(currentTime))
  ]);

  // Create main display container
  return React.createElement('div', { className: 'display-container' }, [
    // Priority banner if needed
    session.isPriority && React.createElement('div', { className: 'priority-banner' }, 'PRIORITY'),
    
    // Header
    React.createElement('div', { className: 'header' }, [
      headerLeft,
      headerCenter,
      headerRight
    ]),
    
    // Destination
    React.createElement('h1', { className: 'destination' }, session.Flight.destination),
    
    // Status label
    React.createElement('div', { className: 'status-label' }, 
      session.sessionType === 'check-in' ? 'PRIJAVA - CHECK-IN' : 'UKRCAVANJE - BOARDING'
    ),
    
    // Flight info
    React.createElement('div', { className: 'flight-info' }, 
      React.createElement('div', { className: 'departure-time' }, [
        React.createElement('span', { className: 'time-label' }, 
          session.Flight.is_departure ? 'VRIJEME POLASKA' : 'DOLAZAK'
        ),
        React.createElement('span', { className: 'time-value' }, formattedFlightTime)
      ])
    )
  ]);
};

export default PublicPage;
