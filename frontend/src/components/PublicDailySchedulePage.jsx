// PublicDailySchedulePage.jsx
// Import polyfills and browser detection for TV compatibility
import '../polyfills';
import '../browser-detect';

import React from 'react';
import { Spinner, Alert } from 'react-bootstrap';
import './PublicDailySchedulePage.css';
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

var PublicDailySchedulePage = function() {
  // Use React.Component instead of hooks for better compatibility
  var _this = this;
  var dailyFlights = React.useState([]);
  var setDailyFlights = dailyFlights[1];
  dailyFlights = dailyFlights[0];
  
  var loading = React.useState(true);
  var setLoading = loading[1];
  loading = loading[0];
  
  var error = React.useState(null);
  var setError = error[1];
  error = error[0];
  
  var visibleDepartures = React.useState(0);
  var setVisibleDepartures = visibleDepartures[1];
  visibleDepartures = visibleDepartures[0];
  
  var visibleArrivals = React.useState(0);
  var setVisibleArrivals = visibleArrivals[1];
  visibleArrivals = visibleArrivals[0];
  
  var currentDateTime = React.useState(new Date());
  var setCurrentDateTime = currentDateTime[1];
  currentDateTime = currentDateTime[0];
  
  var shouldRotate = React.useState(false);
  var setShouldRotate = shouldRotate[1];
  shouldRotate = shouldRotate[0];

  var FLIGHTS_PER_PAGE = 4; // Prikazujemo 4 odlazna i 4 dolazna leta (ukupno 8)
  var ROTATION_INTERVAL = 15000; // Rotacija svakih 15 sekundi

  // Funkcija za formatiranje datuma i vremena
  function formatDateTime(date) {
    var hours = padStart(date.getHours(), 2, '0');
    var minutes = padStart(date.getMinutes(), 2, '0');
    var day = padStart(date.getDate(), 2, '0');
    var month = padStart(date.getMonth() + 1, 2, '0');
    var year = date.getFullYear();
    return hours + ':' + minutes + ' ' + day + '.' + month + '.' + year;
  }

  // Funkcija za formatiranje vremena (samo sati i minute)
  function formatTimeHoursMinutes(dateString) {
    var date = new Date(dateString);
    var hours = padStart(date.getHours(), 2, '0');
    var minutes = padStart(date.getMinutes(), 2, '0');
    return hours + ':' + minutes;
  }

  // Ažuriraj trenutni datum i vrijeme svake sekunde
  React.useEffect(function() {
    var interval = setInterval(function() {
      setCurrentDateTime(new Date());
    }, 1000);

    return function() { clearInterval(interval); };
  }, []);

  // Dohvati dnevne letove i postavi automatsko osvježavanje
  React.useEffect(function() {
    function fetchData() {
      // Koristi XMLHttpRequest umjesto axios za bolju kompatibilnost
      var xhr = new XMLHttpRequest();
      xhr.open('GET', config.apiUrl + '/api/public/daily-schedule', true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var data = JSON.parse(xhr.responseText);
              setDailyFlights(data);
            } catch (err) {
              console.error('Greška pri parsiranju JSON-a:', err);
              setError('Greška pri parsiranju podataka');
            }
          } else {
            console.error('Greška pri dobavljanju dnevnih letova:', xhr.status);
            setError('Greška pri dobavljanju podataka');
          }
          setLoading(false);
        }
      };
      xhr.send();
    }

    // Inicijalno dohvaćanje podataka
    fetchData();
    
    // Automatsko osvježavanje svakih 2 minute (120000 ms)
    var refreshInterval = setInterval(function() {
      console.log('Osvježavanje podataka o letovima...');
      fetchData();
    }, 120000);
    
    // Čišćenje intervala kada se komponenta unmount-a
    return function() { clearInterval(refreshInterval); };
  }, []);

  // Provjera da li treba rotirati letove i balansiranje tablica
  React.useEffect(function() {
    var departures = [];
    var arrivals = [];
    
    // Koristi for petlju umjesto filter za bolju kompatibilnost
    for (var i = 0; i < dailyFlights.length; i++) {
      if (dailyFlights[i].is_departure) {
        departures.push(dailyFlights[i]);
      } else {
        arrivals.push(dailyFlights[i]);
      }
    }
    
    // Rotiramo samo ako ima više od 4 odlazna ILI više od 4 dolazna leta
    var shouldRotateDepartures = departures.length > 4;
    var shouldRotateArrivals = arrivals.length > 4;
    
    // Postavimo stanje rotacije
    setShouldRotate(shouldRotateDepartures || shouldRotateArrivals);
    
    // Ako ne rotiramo, resetiramo indekse za prikaz
    if (!shouldRotate) {
      setVisibleDepartures(0);
      setVisibleArrivals(0);
    }
  }, [dailyFlights, shouldRotate]);

  // Rotacija letova svakih 15 sekundi, samo ako ima više od 8 letova
  React.useEffect(function() {
    if (!shouldRotate) return;

    var departures = [];
    var arrivals = [];
    
    // Koristi for petlju umjesto filter za bolju kompatibilnost
    for (var i = 0; i < dailyFlights.length; i++) {
      if (dailyFlights[i].is_departure) {
        departures.push(dailyFlights[i]);
      } else {
        arrivals.push(dailyFlights[i]);
      }
    }

    function rotateFlights() {
      setVisibleDepartures(function(prev) {
        return (prev + FLIGHTS_PER_PAGE) % Math.max(departures.length, 1);
      });
      setVisibleArrivals(function(prev) {
        return (prev + FLIGHTS_PER_PAGE) % Math.max(arrivals.length, 1);
      });
    }

    var rotationInterval = setInterval(rotateFlights, ROTATION_INTERVAL);

    return function() { clearInterval(rotationInterval); };
  }, [dailyFlights, shouldRotate]);

  if (loading) {
    return React.createElement(Spinner, { 
      animation: "border", 
      className: "public-spinner" 
    });
  }

  if (error) {
    return React.createElement(Alert, { 
      variant: "danger", 
      className: "public-error" 
    }, error);
  }

  var departures = [];
  var arrivals = [];
  
  // Koristi for petlju umjesto filter za bolju kompatibilnost
  for (var i = 0; i < dailyFlights.length; i++) {
    if (dailyFlights[i].is_departure) {
      departures.push(dailyFlights[i]);
    } else {
      arrivals.push(dailyFlights[i]);
    }
  }

  // Priprema letova za prikaz
  var visibleDepartureFlights = [];
  var visibleArrivalFlights = [];
  
  // Uvijek prikazujemo tačno 4 leta po tablici, ili manje ako nema dovoljno letova
  if (departures.length > 4 && shouldRotate) {
    // Ako ima više od 4 odlazna leta i trebamo rotirati, prikazujemo 4 leta s odgovarajućim indeksom
    for (var j = 0; j < FLIGHTS_PER_PAGE; j++) {
      var idx = visibleDepartures + j;
      if (idx < departures.length) {
        visibleDepartureFlights.push(departures[idx]);
      }
    }
  } else {
    // Inače prikazujemo prva 4 leta ili manje ako nema dovoljno
    for (var k = 0; k < Math.min(departures.length, FLIGHTS_PER_PAGE); k++) {
      visibleDepartureFlights.push(departures[k]);
    }
  }
  
  if (arrivals.length > 4 && shouldRotate) {
    // Ako ima više od 4 dolazna leta i trebamo rotirati, prikazujemo 4 leta s odgovarajućim indeksom
    for (var l = 0; l < FLIGHTS_PER_PAGE; l++) {
      var idxArr = visibleArrivals + l;
      if (idxArr < arrivals.length) {
        visibleArrivalFlights.push(arrivals[idxArr]);
      }
    }
  } else {
    // Inače prikazujemo prva 4 leta ili manje ako nema dovoljno
    for (var m = 0; m < Math.min(arrivals.length, FLIGHTS_PER_PAGE); m++) {
      visibleArrivalFlights.push(arrivals[m]);
    }
  }

  // Kreiraj tablicu odlazaka
  function renderDepartureTable() {
    var rows = [];
    for (var i = 0; i < visibleDepartureFlights.length; i++) {
      var flight = visibleDepartureFlights[i];
      rows.push(
        React.createElement('tr', { 
          key: flight.id, 
          className: 'public-flight-row'
        }, [
          React.createElement('td', { className: 'narrow-column' }, i + 1),
          React.createElement('td', { className: 'brojleta1' }, flight.flight_number),
          React.createElement('td', {}, 
            React.createElement('div', { className: 'public-airline-info' }, [
              React.createElement('img', {
                src: flight.Airline && flight.Airline.logo_url ? flight.Airline.logo_url : '/default-logo.png',
                alt: flight.Airline ? flight.Airline.name : 'Airline Logo',
                className: 'public-airline-logo',
                onError: function(e) { e.target.src = '/default-logo.png'; }
              }),
              React.createElement('span', {}, flight.Airline ? flight.Airline.name : 'Nepoznata aviokompanija')
            ])
          ),
          React.createElement('td', { className: 'dolazak1' }, formatTimeHoursMinutes(flight.departure_time)),
          React.createElement('td', { className: 'destination1' }, flight.destination),
          React.createElement('td', { className: 'bilješke1' }, flight.remarks || '')
        ])
      );
    }
    
    return React.createElement('table', { className: 'public-flight-table' }, [
      React.createElement('thead', {}, 
        React.createElement('tr', {}, [
          React.createElement('th', { className: 'narrow-column' }, 'BR.'),
          React.createElement('th', { className: 'brojleta' }, 'LET/FLIGHT'),
          React.createElement('th', {}, 'AVIOKOMPANIJA/AIRLINES'),
          React.createElement('th', { className: 'vrijeme' }, 'VRIJEME/TIME'),
          React.createElement('th', {}, 'ODREDIŠTE/DESTINATION'),
          React.createElement('th', {}, 'BILJEŠKE/REMARKS')
        ])
      ),
      React.createElement('tbody', {}, rows)
    ]);
  }
  
  // Kreiraj tablicu dolazaka
  function renderArrivalTable() {
    var rows = [];
    for (var i = 0; i < visibleArrivalFlights.length; i++) {
      var flight = visibleArrivalFlights[i];
      rows.push(
        React.createElement('tr', { 
          key: flight.id, 
          className: 'public-flight-row'
        }, [
          React.createElement('td', { className: 'narrow-column' }, i + 1),
          React.createElement('td', { className: 'brojleta1' }, flight.flight_number),
          React.createElement('td', {}, 
            React.createElement('div', { className: 'public-airline-info' }, [
              React.createElement('img', {
                src: flight.Airline && flight.Airline.logo_url ? flight.Airline.logo_url : '/default-logo.png',
                alt: flight.Airline ? flight.Airline.name : 'Airline Logo',
                className: 'public-airline-logo',
                onError: function(e) { e.target.src = '/default-logo.png'; }
              }),
              React.createElement('span', {}, flight.Airline ? flight.Airline.name : 'Nepoznata aviokompanija')
            ])
          ),
          React.createElement('td', { className: 'dolazak1' }, formatTimeHoursMinutes(flight.arrival_time)),
          React.createElement('td', { className: 'destination1' }, flight.destination),
          React.createElement('td', { className: 'bilješke1' }, flight.remarks || '')
        ])
      );
    }
    
    return React.createElement('table', { className: 'public-flight-table' }, [
      React.createElement('thead', {}, 
        React.createElement('tr', {}, [
          React.createElement('th', { className: 'narrow-column' }, 'BR.'),
          React.createElement('th', { className: 'brojleta' }, 'LET/FLIGHT'),
          React.createElement('th', {}, 'AVIOKOMPANIJA/AIRLINES'),
          React.createElement('th', { className: 'vrijeme' }, 'VRIJEME/TIME'),
          React.createElement('th', {}, 'ODREDIŠTE/DESTINATION'),
          React.createElement('th', {}, 'BILJEŠKE/REMARKS')
        ])
      ),
      React.createElement('tbody', {}, rows)
    ]);
  }

  // Koristi React.createElement umjesto JSX za bolju kompatibilnost
  return React.createElement('div', { className: 'public-schedule-container' }, [
    React.createElement('div', { className: 'public-date-time' }, 
      'Trenutno vrijeme: ' + formatDateTime(currentDateTime)
    ),
    React.createElement('div', { className: 'public-schedule-content' }, [
      React.createElement('div', { className: 'public-departures' }, [
        React.createElement('h2', { className: 'public-section-title' }, 'ODLASCI/DEPARTURES ✈️'),
        React.createElement('div', { className: 'table-container' }, renderDepartureTable())
      ]),
      React.createElement('div', { className: 'public-arrivals' }, [
        React.createElement('h2', { className: 'public-section-title' }, 'DOLASCI/ARRIVALS 🛬'),
        React.createElement('div', { className: 'table-container' }, renderArrivalTable())
      ])
    ])
  ]);
};

export default PublicDailySchedulePage;
