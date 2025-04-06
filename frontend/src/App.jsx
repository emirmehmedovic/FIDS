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
import NotificationTemplateManagement from './components/NotificationTemplateManagement'; // Import template management
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



function App() {
  return (
    <Router>
      {/* AuthProvider removed from here, already present in index.jsx */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <Routes>
        {/* Javne rute */}
        <Route path="/public/:pageId" element={<PublicPage />} />
          <Route path="/:pageId" element={<PublicPage />} />
          <Route path="/public-daily-schedule" element={<PublicDailySchedulePage />} />
          <Route path="/login" element={<Login />} />

          {/* Redirect root to login */}
          <Route path="/" element={<Navigate replace to="/login" />} />

          {/* Privatne rute sa Sidebar-om */}
          {/* Dashboard: Accessible to all authenticated users */}
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
          {/* Admin Panel: Accessible only to 'admin' */}
          <Route
            path="/admin-panel"
            element={
              <PrivateRoute allowedRoles={['admin']}> 
                <PrivateLayout>
                  <AdminPanel />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          {/* Monthly Schedule: Accessible to 'admin' and 'user' */}
          <Route
            path="/monthly-schedule"
            element={
              <PrivateRoute allowedRoles={['admin', 'user']}> 
                <PrivateLayout>
                  <MonthlySchedule />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          {/* Daily Schedule: Accessible to 'admin' and 'user' */}
          <Route
            path="/daily-schedule"
            element={
              <PrivateRoute allowedRoles={['admin', 'user']}> 
                <PrivateLayout>
                  <DailySchedule />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          {/* Airlines: Accessible to 'admin' and 'user' */}
          <Route
            path="/airlines"
            element={
              <PrivateRoute allowedRoles={['admin', 'user']}> 
                <PrivateLayout>
                  <AirlineManagement />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          {/* Check-in: Accessible to 'stw', 'admin', and 'user' */}
          <Route
            path="/check-in"
            element={
              <PrivateRoute allowedRoles={['stw', 'admin', 'user']}> 
                <PrivateLayout>
                  <CheckIn />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          {/* Content Management: Accessible to 'stw', 'admin', and 'user' */}
          <Route
            path="/content-management"
            element={
              <PrivateRoute allowedRoles={['stw', 'admin', 'user']}> 
                <PrivateLayout>
                  <ContentManagementPage />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          {/* Destinations: Accessible to 'admin' and 'user' */}
          <Route
            path="/manage-destinations"
            element={
              <PrivateRoute allowedRoles={['admin', 'user']}> 
                <PrivateLayout>
                  <DestinationManager />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          {/* Flight Numbers: Accessible to 'admin' and 'user' */}
          <Route
            path="/manage-flight-numbers"
            element={
              <PrivateRoute allowedRoles={['admin', 'user']}> 
                <PrivateLayout>
                  <FlightNumberManager />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          {/* Notification Templates: Accessible to 'stw', 'admin', and 'user' */}
          <Route
            path="/admin/templates"
            element={
              <PrivateRoute allowedRoles={['stw', 'admin', 'user']}> 
                <PrivateLayout>
                  <NotificationTemplateManagement />
                </PrivateLayout>
              </PrivateRoute>
            }
          />
          {/* Default ruta - Consider a dedicated 404 component */}
          <Route path="*" element={<h1>404 Not Found</h1>} /> 
        </Routes>
    </Router>
  );
}

// Removed inline PrivateLayout component - now using imported component

export default App;
