import React, { useState, useEffect } from 'react';
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Use axios for consistency
import config from '../config'; // Use config for API URL
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
    const [activeSession, setActiveSession] = useState(null); // Rename state for clarity
    const [currentTime, setCurrentTime] = useState(new Date());
    const [error, setError] = useState(null); // Add error state

    useEffect(() => {
      // Fetch session data every 15 seconds (adjust interval as needed)
      const fetchSession = async () => {
        if (!pageId) return; // Don't fetch if pageId is not available yet
        try {
          // Use the correct endpoint from config
          const response = await axios.get(`${config.apiUrl}/display/active?page=${pageId}`);
          // The backend returns an array, we usually display the first one (highest priority or latest)
          setActiveSession(response.data?.[0] || null); // Set to null if array is empty
          setError(null); // Clear previous errors
        } catch (err) {
          console.error('Error fetching active session:', err);
          setError('Greška pri učitavanju podataka sesije.');
          setActiveSession(null); // Clear session on error
        }
      };

      fetchSession(); // Initial fetch
      const interval = setInterval(fetchSession, 15000); // Fetch every 15 seconds
  
      return () => clearInterval(interval); // Cleanup interval on unmount
    }, [pageId]);

    useEffect(() => {
      // Update time every second for a live clock feel
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer); // Cleanup timer on unmount
    }, []);

    // Display error message if fetch failed
    if (error) {
        return <div className="display-container error-message">{error}</div>;
    }

    // Display default content if no active session
    if (!activeSession) {
        return <DefaultContent />;
    }

    // Determine flight data (handles both standard and custom sessions)
    const displayData = activeSession.CustomFlightData || activeSession.Flight;

    // Fallback if somehow session exists but no flight data
    if (!displayData) {
        console.warn("Active session found, but no flight data (Flight or CustomFlightData). Session:", activeSession);
        return <DefaultContent />; // Or show a specific error/placeholder
    }

    const airlineLogoUrl = displayData.Airline?.logoUrl ? `${config.apiUrl}${displayData.Airline.logoUrl}` : '/SkyLine logo.png'; // Corrected path
    const flightNumber = displayData.flight_number || 'N/A';
    const destination = displayData.destination || 'N/A';

    // Determine status label text and class
    let statusText = '';
    let statusClass = '';
    let showNotificationBox = false;

    switch (activeSession.sessionType) {
        case 'check-in':
            statusText = 'PRIJAVA / CHECK-IN';
            statusClass = 'check-in';
            break;
        case 'boarding':
            statusText = 'UKRCAVANJE / BOARDING';
            statusClass = 'boarding';
            break;
        case 'notice':
            statusText = 'OBAVJEŠTENJE / PASSENGER NOTICE';
            statusClass = 'notice';
            showNotificationBox = true; // Always show box for notice type
            break;
        default:
            statusText = activeSession.sessionType.toUpperCase(); // Fallback
            statusClass = 'default';
    }

    return (
      <div className={`display-container ${statusClass}`}> {/* Add session type class */}
        <div className="header">
          <span className="flight-number">{flightNumber}</span>
          {/* Ensure logo URL is correctly formed */}
          <img src={airlineLogoUrl} alt="Airline Logo" className="airline-logo" />
          <span className="current-time">
            {/* Format time more simply */}
            {currentTime.toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <h1 className="destination">{destination}</h1>

        <div className={`status-label ${statusClass}`}>
          {activeSession.sessionType === 'notice' && <span className="notice-icon">⚠️</span>} {/* Add icon for notice */}
          {statusText}
        </div>

        {/* Show notification text in a box only for 'notice' type */}
        {showNotificationBox && (
          <div className="notification-box">
            {activeSession.notification_text || ''}
          </div>
        )}

        {/* Priority banner - adjust text based on session type? */}
        {activeSession.isPriority && (
          <div className="priority-banner">
            {activeSession.sessionType === 'boarding' ? 'PRIORITY BOARDING' : 'PRIORITY CHECK-IN'}
          </div>
        )}
      </div>
    );
  }

export default PublicDisplay;
