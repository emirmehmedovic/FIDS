import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './PublicPage.css';

const PublicPage = () => {
  const { pageId } = useParams();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState(null);
  const [staticContent, setStaticContent] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!pageId) return;

      try {
        const [sessionResponse, staticResponse] = await Promise.all([
          fetch(`http://localhost:5001/api/display/active?page=${pageId}`),
          fetch(`http://localhost:5001/api/content/page/${pageId}`)
        ]);

        // Process session
        if (!sessionResponse.ok) throw new Error('Greška pri dobavljanju sesije');
        const sessions = await sessionResponse.json();

        if (sessions.length > 0) {
          setSession(sessions[0]);
        } else {
          setSession(null);
        }

        // Process static content
        if (staticResponse.ok) {
          const staticData = await staticResponse.json();
          setStaticContent(staticData.content);
        } else {
          setStaticContent(null);
        }

      } catch (err) {
        console.error('Greška:', err);
        setError(err.message);
      }
    };

    // Inicijalno dohvaćanje podataka
    fetchData();
    
    // Automatsko osvježavanje svakih 2 minute (120000 ms)
    // Ovo će automatski osvježiti stranicu kada se otvori ili zatvori sesija
    const refreshInterval = setInterval(() => {
      console.log('Osvježavanje podataka o sesiji...');
      fetchData();
    }, 120000);
    
    // Čišćenje intervala kada se komponenta unmount-a
    return () => clearInterval(refreshInterval);
  }, [pageId]);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format date as DD.MM.YYYY
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Format time as HH:MM
  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Render error message if there is an error
  if (error) {
    return (
      <div className="default-content">
        <h1>Greška prilikom učitavanja sesije</h1>
        <p>{error}</p>
      </div>
    );
  }

  // Default content when no session is active
  if (!session || !session.Flight || !session.Flight.flight_number) {
    return (
      <div className="default-content">
        {staticContent?.imageUrl ? (
          <img 
            src={`http://localhost:5001${staticContent.imageUrl}`}
            alt="Statički sadržaj" 
            className="static-image"
          />
        ) : (
          <>
            <img src="/SkyLine logo.png" alt="SkyLine Logo" className="logo" />
            <h1>Dobrodošli na SkyLine Aerodrom</h1>
            <p>Trenutno nema aktivnih sesija za prikaz</p>
          </>
        )}
      </div>
    );
  }

  // Format departure or arrival time
  const flightTime = session.Flight.is_departure 
    ? new Date(session.Flight.departure_time) 
    : new Date(session.Flight.arrival_time);
  
  const formattedFlightTime = formatTime(flightTime);

  return (
    <div className="display-container">
      {session.isPriority && (
        <div className="priority-banner">PRIORITY CHECK-IN</div>
      )}
      
      <div className="header">
        <div className="header-left">
          <span className="flight-number">{session.Flight.flight_number}</span>
        </div>
        
        <div className="header-center">
          {session.Flight.Airline?.logo_url && (
            <div className="logo-container">
              <img 
                src={session.Flight.Airline.logo_url}
                alt="Airline Logo" 
                className="airline-logo1"
              />
            </div>
          )}
        </div>
        
        <div className="header-right">
          <div className="current-time">
            {formatTime(currentTime)}
          </div>
          <div className="current-date">
            {formatDate(currentTime)}
          </div>
        </div>
      </div>
      
      <h1 className="destination">{session.Flight.destination}</h1>
   
      
      <div className="status-label">
        {session.sessionType === 'check-in' 
          ? 'PRIJAVA - CHECK-IN' 
          : 'UKRCAVANJE - BOARDING'}
      </div>
         
      <div className="flight-info">
        <div className="departure-time">
          <span className="time-label">{session.Flight.is_departure ? 'VRIJEME POLASKA' : 'DOLAZAK'}</span>
          <span className="time-value">{formattedFlightTime}</span>
        </div>
      </div>
    </div>
    
  );
};

export default PublicPage;
