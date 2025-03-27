// components/Dashboard.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import './Dashboard.css';
import { 
  FiCalendar, 
  FiGrid, 
  FiAirplay, 
  FiMonitor, 
  FiMapPin, 
  FiHash, 
  FiCheckSquare,
  FiShield
} from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();
  
  // Animation effect for cards
  useEffect(() => {
    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('animate-in');
      }, 100 * index);
    });
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dobrodošli, {user?.username || 'User'}</h1>
        <p className="dashboard-subtitle">Manage your flight operations with ease</p>
      </div>
      
      <div className="dashboard-grid">
        {/* Hide Daily Schedule from stw */}
        {user && user.role !== 'stw' && (
          <Link to="/daily-schedule" className="dashboard-card glassmorphism">
            <div className="card-icon">
              <FiCalendar />
            </div>
            <div className="card-content">
              <h3>Dnevni raspored</h3>
              <p>Pregled i upravljanje dnevnim rasporedom letova</p>
            </div>
            <div className="card-arrow">→</div>
          </Link>
        )}
        
        {/* Hide Monthly Schedule from stw */}
        {user && user.role !== 'stw' && (
          <Link to="/monthly-schedule" className="dashboard-card glassmorphism">
            <div className="card-icon">
              <FiGrid />
            </div>
            <div className="card-content">
              <h3>Mjesečni raspored</h3>
              <p>Planiranje i pregled mjesečnog rasporeda letova</p>
            </div>
            <div className="card-arrow">→</div>
          </Link>
        )}
        
        {/* Hide Airlines from stw */}
        {user && user.role !== 'stw' && (
          <Link to="/airlines" className="dashboard-card glassmorphism">
            <div className="card-icon">
              <FiAirplay />
            </div>
            <div className="card-content">
              <h3>Aviokompanije</h3>
              <p>Upravljanje aviokompanijama i njihovim letovima</p>
            </div>
            <div className="card-arrow">→</div>
          </Link>
        )}
        
        {/* Content Management is visible to stw */}
        <Link to="/content-management" className="dashboard-card glassmorphism">
          <div className="card-icon">
            <FiMonitor />
          </div>
          <div className="card-content">
            <h3>Upravljanje sadržajem</h3> {/* Corrected title based on sidebar */}
            <p>Kontrola sadržaja prikazanog na aerodromskim ekranima</p>
          </div>
          <div className="card-arrow">→</div>
        </Link>
        
        {/* Hide Destinations from stw */}
        {user && user.role !== 'stw' && (
          <Link to="/manage-destinations" className="dashboard-card glassmorphism">
            <div className="card-icon">
              <FiMapPin />
            </div>
            <div className="card-content">
              <h3>Destinacije</h3>
              <p>Upravljanje destinacijama i rutama</p>
            </div>
            <div className="card-arrow">→</div>
          </Link>
        )}
        
        {/* Hide Flight Numbers from stw */}
        {user && user.role !== 'stw' && (
          <Link to="/manage-flight-numbers" className="dashboard-card glassmorphism">
            <div className="card-icon">
              <FiHash />
            </div>
            <div className="card-content">
              <h3>Brojevi letova</h3>
              <p>Dodavanje i uređivanje brojeva letova</p>
            </div>
            <div className="card-arrow">→</div>
          </Link>
        )}
        
        {/* Check-in is visible to stw */}
        <Link to="/check-in" className="dashboard-card glassmorphism">
          <div className="card-icon">
            <FiCheckSquare />
          </div>
          <div className="card-content">
            <h3>Check-in/Boarding</h3>
            <p>Upravljanje check-in i boarding procesima</p>
          </div>
          <div className="card-arrow">→</div>
        </Link>
        
        {user && user.role === 'admin' && (
          <Link to="/admin-panel" className="dashboard-card glassmorphism admin-card">
            <div className="card-icon">
              <FiShield />
            </div>
            <div className="card-content">
              <h3>Adminski panel</h3>
              <p>Administratorske funkcije i postavke</p>
            </div>
            <div className="card-arrow">→</div>
          </Link>
        )}
      </div>
      
      <div className="dashboard-footer">
        <p>SkyLine Flight Management System © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

export default Dashboard;
