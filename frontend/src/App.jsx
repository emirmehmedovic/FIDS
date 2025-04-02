import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import PublicPage from './components/PublicPage';
import Dashboard from './components/Dashboard';
import MonthlySchedule from './components/MonthlySchedule';
import AirlineManagement from './components/AirlineManagement';
import DailySchedule from './components/DailySchedule';
import CheckIn from './components/CheckInPage';
import ContentManagementPage from './components/ContentManagementPage';
import PublicDailySchedulePage from './components/PublicDailySchedulePage';
import Login from './components/Login';
import { AuthProvider } from './components/AuthProvider';
import PrivateRoute from './components/PrivateRoute';
import PrivateLayout from './components/PrivateLayout';
import AdminPanel from './components/AdminPanel';
import DestinationManager from './components/DestinationManagement';
import FlightNumberManager from './components/FlightNumberManager';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastContainer /> {/* Dodajte ToastContainer ovdje */}
        <Routes>
          {/* Javne rute */}
          <Route path="/public/:pageId" element={<PublicPage />} />
          <Route path="/:pageId" element={<PublicPage />} />
          <Route path="/public-daily-schedule" element={<PublicDailySchedulePage />} />
          <Route path="/login" element={<Login />} />

          {/* Redirect root to login */}
          <Route path="/" element={<Navigate replace to="/login" />} />

          {/* Privatne rute sa Sidebar-om */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <Dashboard />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin-panel"
            element={
              <PrivateRoute requiredRole="admin">
                <PrivateLayout>
                  <AdminPanel />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/monthly-schedule"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <MonthlySchedule />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/daily-schedule"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <DailySchedule />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/airlines"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <AirlineManagement />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/check-in"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <CheckIn />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/content-management"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <ContentManagementPage />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/manage-destinations"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <DestinationManager />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/manage-flight-numbers"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <FlightNumberManager />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          {/* Default ruta */}
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

// Removed inline PrivateLayout component - now using imported component

export default App;
