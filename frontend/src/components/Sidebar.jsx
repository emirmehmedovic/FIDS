// components/Sidebar.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import './Sidebar.css';
import { 
  FiHome, 
  FiCheckSquare, 
  FiCalendar, 
  FiGrid, 
  FiAirplay, 
  FiMonitor, 
  FiMapPin, 
  FiHash, 
  FiShield, 
  FiLogOut,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Check if the current path matches the link path
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`sidebar glassmorphism ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <img src="/SkyLine logo.png" alt="SkyLine FIDS Logo" className="sidebar-logo" />
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      <ul className="sidebar-menu">
        <li className={isActive('/dashboard') ? 'active' : ''}>
          <Link to="/dashboard">
            <span className="icon"><FiHome /></span>
            <span className="text">Dashboard</span>
            {isActive('/dashboard') && <span className="active-indicator"></span>}
          </Link>
        </li>
        <li className={isActive('/check-in') ? 'active' : ''}>
          <Link to="/check-in">
            <span className="icon"><FiCheckSquare /></span>
            <span className="text">Check-in/Boarding</span>
            {isActive('/check-in') && <span className="active-indicator"></span>}
          </Link>
        </li>
        <li className={isActive('/daily-schedule') ? 'active' : ''}>
          <Link to="/daily-schedule">
            <span className="icon"><FiCalendar /></span>
            <span className="text">Dnevni raspored</span>
            {isActive('/daily-schedule') && <span className="active-indicator"></span>}
          </Link>
        </li>
        <li className={isActive('/monthly-schedule') ? 'active' : ''}>
          <Link to="/monthly-schedule">
            <span className="icon"><FiGrid /></span>
            <span className="text">Mjesečni raspored</span>
            {isActive('/monthly-schedule') && <span className="active-indicator"></span>}
          </Link>
        </li>
        <li className={isActive('/airlines') ? 'active' : ''}>
          <Link to="/airlines">
            <span className="icon"><FiAirplay /></span>
            <span className="text">Aviokompanije</span>
            {isActive('/airlines') && <span className="active-indicator"></span>}
          </Link>
        </li>
        <li className={isActive('/content-management') ? 'active' : ''}>
          <Link to="/content-management">
            <span className="icon"><FiMonitor /></span>
            <span className="text">Upravljanje sadržajem</span>
            {isActive('/content-management') && <span className="active-indicator"></span>}
          </Link>
        </li>
        <li className={isActive('/manage-destinations') ? 'active' : ''}>
          <Link to="/manage-destinations">
            <span className="icon"><FiMapPin /></span>
            <span className="text">Destinacije</span>
            {isActive('/manage-destinations') && <span className="active-indicator"></span>}
          </Link>
        </li>
        <li className={isActive('/manage-flight-numbers') ? 'active' : ''}>
          <Link to="/manage-flight-numbers">
            <span className="icon"><FiHash /></span>
            <span className="text">Brojevi letova</span>
            {isActive('/manage-flight-numbers') && <span className="active-indicator"></span>}
          </Link>
        </li>

        {user && user.role === 'admin' && (
          <li className={isActive('/admin-panel') ? 'active' : ''}>
            <Link to="/admin-panel">
              <span className="icon"><FiShield /></span>
              <span className="text">Adminski panel</span>
              {isActive('/admin-panel') && <span className="active-indicator"></span>}
            </Link>
          </li>
        )}
      </ul>

      <div className="sidebar-footer">
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <span className="icon"><FiLogOut /></span>
          <span className="text">Odjavi se</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
