import React, { useState, useEffect } from 'react';
import './PublicDisplay.css';

// Default content component when no session is active
const DefaultContent = () => {
  return (
    <div className="default-content">
      <img src="/SkyLine logo.png" alt="SkyLine Logo" className="logo" />
      <h1>Dobrodošli na SkyLine Aerodrom</h1>
      <p>Trenutno nema aktivnih sesija za prikaz</p>
    </div>
  );
};

function PublicDisplay({ pageId }) {
    const [session, setSession] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
  
    useEffect(() => {
      // Osvježi svakih 5 minuta
      const fetchSession = async () => {
        try {
          const res = await fetch(`http://localhost:5001/api/sessions/active?page=${pageId}`);
          const data = await res.json();
          setSession(data);
        } catch (error) {
          console.error('Error fetching session:', error);
        }
      };
  
      fetchSession();
      const interval = setInterval(fetchSession, 300000);
  
      return () => clearInterval(interval);
    }, [pageId]);
  
    useEffect(() => {
      // Osvježi vrijeme svake minute
      const timer = setInterval(() => setCurrentTime(new Date()), 60000);
      return () => clearInterval(timer);
    }, []);
  
    if (!session || !session.Flight) return <DefaultContent />;
  
    return (
      <div className="display-container">
        <div className="header">
        <span className="flight-number">{session.Flight.flight_number}</span>
        <img src={session.Flight.Airline.logoUrl} alt="Airline Logo" />
          <span className="current-time">
            {currentTime.toLocaleString('bs-BA', { timeZone: 'Europe/Sarajevo' })}
          </span>
        </div>
        
        <h1 className="destination">{session.Flight.destination}</h1>
        <div className="status-label">
          {session.sessionType === 'check-in' ? 'PRIJAVA - CHECK-IN' : 'UKRCAVANJE - BOARDING'}
        </div>
        
        {session.isPriority && (
          <div className="priority-banner">PRIORITY CHECK-IN</div>
        )}
      </div>
    );
  }
