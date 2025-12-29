// components/Sidebar.jsx
import React, { useState, useEffect } from 'react'; // Combined imports
import { Link, useNavigate, useLocation } from 'react-router-dom';
// Removed duplicate import lines
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
  FiChevronRight,
  FiFileText,
  FiTool
} from 'react-icons/fi';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Effect to add/remove class on app-container based on collapsed state
  useEffect(() => {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      if (collapsed) {
        appContainer.classList.add('sidebar-collapsed');
      } else {
        appContainer.classList.remove('sidebar-collapsed');
      }
    }
    // Cleanup function to remove the class if the component unmounts
    return () => {
      if (appContainer) {
        appContainer.classList.remove('sidebar-collapsed');
      }
    };
  }, [collapsed]); // Dependency array includes collapsed state

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
        {/* Dashboard: Visible to stw, admin, user */}
        {user && (
          <li className={isActive('/dashboard') ? 'active' : ''} data-tooltip="Dashboard">
            <Link to="/dashboard">
              <span className="icon"><FiHome /></span>
              <span className="text">Dashboard</span>
              {isActive('/dashboard') && <span className="active-indicator"></span>}
            </Link>
          </li>
        )}
        {/* Check-in: Visible to stw, admin, user */}
        {user && (
          <li className={isActive('/check-in') ? 'active' : ''} data-tooltip="Check-in/Boarding">
            <Link to="/check-in">
              <span className="icon"><FiCheckSquare /></span>
            <span className="text">Check-in/Boarding</span>
            {isActive('/check-in') && <span className="active-indicator"></span>}
          </Link>
          </li>
        )}
        {/* Support Functions: Visible to stw, admin, user */}
        {user && (
          <li className={isActive('/support-functions') ? 'active' : ''} data-tooltip="Pomoćne funkcije">
            <Link to="/support-functions">
              <span className="icon"><FiTool /></span>
              <span className="text">Pomoćne funkcije</span>
              {isActive('/support-functions') && <span className="active-indicator"></span>}
            </Link>
          </li>
        )}
        {/* Daily Schedule: Visible to admin, user */}
        {user && user.role !== 'stw' && (
          <li className={isActive('/daily-schedule') ? 'active' : ''} data-tooltip="Dnevni raspored">
            <Link to="/daily-schedule">
              <span className="icon"><FiCalendar /></span>
              <span className="text">Dnevni raspored</span>
              {isActive('/daily-schedule') && <span className="active-indicator"></span>}
            </Link>
          </li>
        )}
        {/* Monthly Schedule: Visible to admin, user */}
        {user && user.role !== 'stw' && (
          <li className={isActive('/monthly-schedule') ? 'active' : ''} data-tooltip="Mjesečni raspored">
            <Link to="/monthly-schedule">
              <span className="icon"><FiGrid /></span>
            <span className="text">Mjesečni raspored</span>
              {isActive('/monthly-schedule') && <span className="active-indicator"></span>}
            </Link>
          </li>
        )}
        {/* Airlines: Visible to admin, user */}
        {user && user.role !== 'stw' && (
          <li className={isActive('/airlines') ? 'active' : ''} data-tooltip="Aviokompanije">
            <Link to="/airlines">
              <span className="icon"><FiAirplay /></span>
              <span className="text">Aviokompanije</span>
              {isActive('/airlines') && <span className="active-indicator"></span>}
            </Link>
          </li>
        )}
        {/* Content Management: Visible to stw, admin, user */}
        {user && (
          <li className={isActive('/content-management') ? 'active' : ''} data-tooltip="Upravljanje sadržajem">
            <Link to="/content-management">
              <span className="icon"><FiMonitor /></span>
            <span className="text">Upravljanje sadržajem</span>
            {isActive('/content-management') && <span className="active-indicator"></span>}
          </Link>
          </li>
        )}
        {/* Destinations: Visible to admin, user */}
        {user && user.role !== 'stw' && (
          <li className={isActive('/manage-destinations') ? 'active' : ''} data-tooltip="Destinacije">
            <Link to="/manage-destinations">
              <span className="icon"><FiMapPin /></span>
              <span className="text">Destinacije</span>
              {isActive('/manage-destinations') && <span className="active-indicator"></span>}
            </Link>
          </li>
        )}
        {/* Flight Numbers: Visible to admin, user */}
        {user && user.role !== 'stw' && (
          <li className={isActive('/manage-flight-numbers') ? 'active' : ''} data-tooltip="Brojevi letova">
            <Link to="/manage-flight-numbers">
              <span className="icon"><FiHash /></span>
            <span className="text">Brojevi letova</span>
              {isActive('/manage-flight-numbers') && <span className="active-indicator"></span>}
            </Link>
          </li>
        )}

        {/* Admin Panel: Visible only to admin */}
        {user && user.role === 'admin' && (
          <li className={isActive('/admin-panel') ? 'active' : ''} data-tooltip="Adminski panel">
            <Link to="/admin-panel">
              <span className="icon"><FiShield /></span>
              <span className="text">Adminski panel</span>
              {isActive('/admin-panel') && <span className="active-indicator"></span>}
            </Link>
          </li>
        )}
        {/* Notification Template Management: Visible to stw, admin, user */}
        {user && (
          <li className={isActive('/admin/templates') ? 'active' : ''} data-tooltip="Upravljanje Šablonima">
            <Link to="/admin/templates">
              <span className="icon"><FiFileText /></span>
              <span className="text">Upravljanje Šablonima</span>
              {isActive('/admin/templates') && <span className="active-indicator"></span>}
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
