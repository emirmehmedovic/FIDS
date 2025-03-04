// CheckInPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CheckInPage.css';

function CheckIn() {
  const [flights, setFlights] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [pageId, setPageId] = useState('C1');
  const [isPriority, setIsPriority] = useState(false);
  const [sessionType, setSessionType] = useState('check-in');
  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState([]);
  const [flightData, setFlightData] = useState(null);
  const [staticContent, setStaticContent] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [flightsRes, airlinesRes, contentRes, sessionsRes] = await Promise.all([
          axios.get('http://localhost:5001/api/flights/daily-departures'),
          axios.get('http://localhost:5001/api/airlines'),
          axios.get(`http://localhost:5001/api/content/page/${pageId}`),
          axios.get('http://localhost:5001/api/display/active')
        ]);

        setFlights(flightsRes.data);
        setAirlines(airlinesRes.data);
        setActiveSessions(sessionsRes.data);

        if (contentRes.data.isSessionActive) {
          setFlightData(contentRes.data.content.Flight);
        } else {
          setStaticContent(contentRes.data.content);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [pageId]);

  const refreshSessions = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/display/active');
      setActiveSessions(response.data);
    } catch (error) {
      console.error('Greška pri osvježavanju sesija:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFlight) {
      alert('Molimo odaberite let.');
      return;
    }
    try {
      const isBoardingPage = pageId.startsWith('U');
      await axios.post('http://localhost:5001/api/display/sessions', {
        flightId: selectedFlight.id,
        pageId,
        sessionType: isBoardingPage ? 'boarding' : 'check-in',
        isPriority
      });
      alert('Sesija uspješno pokrenuta!');
      await refreshSessions();
    } catch (err) {
      console.error('Greška pri pokretanju sesije:', err);
      alert('Greška pri pokretanju sesije!');
    }
  };

  const handleCloseSession = async (sessionId) => {
    try {
      await axios.put(`http://localhost:5001/api/display/sessions/${sessionId}/close`);
      alert('Sesija uspješno zatvorena!');
      await refreshSessions();
    } catch (err) {
      console.error('Greška pri zatvaranju sesije:', err);
      alert('Greška pri zatvaranju sesije!');
    }
  };

  const getAirlineName = (airlineId) => {
    const airline = airlines.find(a => a.id.toString() === airlineId.toString());
    return airline?.name || 'Nepoznata aviokompanija';
  };

  const getPageAlias = (pageId) => {
    if (pageId.startsWith('C')) {
      const number = parseInt(pageId.slice(1), 10);
      return `Šalter ${number}`;
    } else if (pageId.startsWith('U')) {
      const number = parseInt(pageId.slice(1), 10);
      switch (number) {
        case 1:
          return '---------';
        case 2:
          return 'Izlazni Gate 1 (Lijevo)';
        case 3:
          return 'Izlazni Gate 2 (Desno)';
        case 4:
          return 'Izlazni Gate 3 (Novi gate)';
        case 5:
          return 'Izlazni Gate 4';
        case 6:
          return 'Izlazni Gate 5';
        default:
          return `Izlazni Gate ${number}`;
      }
    }
    return pageId;
  };

  if (loading) {
    return <div className="container mt-4">Učitavanje podataka...</div>;
  }

  return (
    <div className="container mt-4">
      <h2>Pokretanje Sesije</h2>
      
      <div className="card mb-4">
        <div className="card-body">
          {flightData ? (
            <div className="active-session">
              <h4>Aktivna sesija: {flightData.flight_number}</h4>
              <p>Destinacija: {flightData.destination}</p>
            </div>
          ) : (
            <div className="static-content">
              {staticContent && (
                <img 
                  src={staticContent.imageUrl} 
                  alt="Statički sadržaj" 
                  className="img-fluid"
                />
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="card mb-5 session-form">
        <div className="card-body">
          <h4>Postavke sesije</h4>
          
          <div className="row mb-4">
            <div className="col-md-3">
              <label className="form-label">Sesija:</label>
              <select 
                className="form-select"
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
              >
                <option value="check-in">Check-in</option>
                <option value="boarding">Boarding</option>
              </select>
            </div>
            
            <div className="col-md-3">
              <label className="form-label">Ekran:</label>
              <select
                className="form-select"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
              >
                {[...Array(20)].map((_, i) => {
                  const pageId = `C${i + 1}`;
                  return (
                    <option key={pageId} value={pageId}>
                      {getPageAlias(pageId)}
                    </option>
                  );
                })}
                {[...Array(6)].map((_, i) => {
                  const pageId = `U${i + 1}`;
                  return (
                    <option key={pageId} value={pageId}>
                      {getPageAlias(pageId)}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div className="col-md-4">
              <label className="form-label">Let:</label>
              <select
                className="form-select"
                onChange={(e) => setSelectedFlight(flights.find(f => f.id.toString() === e.target.value))}
              >
                <option value="">Odaberite let</option>
                {flights.map(flight => (
                  <option key={flight.id} value={flight.id}>
                    {`${getAirlineName(flight.airline_id)} - ${flight.flight_number} - 
                    ${flight.destination} - 
                    ${new Date(flight.departure_time).toLocaleString('hr-HR')}`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-md-2 d-flex align-items-end">
              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  id="priorityCheck"
                  className="form-check-input"
                  checked={isPriority}
                  onChange={(e) => setIsPriority(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="priorityCheck">
                 Priority
                </label>
              </div>
            </div>
          </div>
          
          <div className="d-grid">
            <button 
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={!selectedFlight}
            >
              Pokreni sesiju
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 className="mb-4">Aktivne sesije</h3>
          
          {activeSessions.length === 0 ? (
            <div className="alert alert-info">Nema aktivnih sesija</div>
          ) : (
            <div className="active-sessions">
              {activeSessions.map(session => (
                <div key={session.id} className="active-session-card">
                  <h5>{session.Flight?.flight_number} - {session.Flight?.destination}</h5>
                  <div className="d-flex align-items-center">
                    <span className={`badge ${session.sessionType === 'check-in' ? 'check-in' : 'boarding'}`}>
                      {session.sessionType}
                    </span>
                    <span className="badge bg-secondary">Stranica: {session.pageId}</span>
                    {session.isPriority && <span className="badge bg-warning">Prioritet</span>}
                    <small className="text-muted ms-auto">
                      Početak: {new Date(session.start_time).toLocaleString()}
                    </small>
                    <button 
                      className="btn btn-danger btn-sm ms-3"
                      onClick={() => handleCloseSession(session.id)}
                    >
                      Zatvori sesiju
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckIn;
