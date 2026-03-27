import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import { Suspense, lazy } from 'react';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Events = lazy(() => import('./pages/Events'));
const Profile = lazy(() => import('./pages/Profile'));
const AddEvent = lazy(() => import('./pages/AddEvent'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EventRegister = lazy(() => import('./pages/EventRegister'));
const EditEvent = lazy(() => import('./pages/EditEvent'));
const Refund = lazy(() => import('./pages/Refund'));
const NotFound = lazy(() => import('./pages/NotFound'));
const CheckTicket = lazy(() => import('./pages/CheckTicket'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const MapView = lazy(() => import('./pages/MapView'));
import './i18n';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <main style={{ paddingTop: '80px' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px 20px', fontSize: '24px', color: 'var(--primary)', fontWeight: 'bold' }}><i className="fas fa-spinner fa-spin"></i> Загрузка...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
            <Route path="/register" element={<Register setAuth={setIsAuthenticated} />} />
            <Route path="/events" element={<Events />} />
            <Route path="/event/:id" element={<EventDetails isAuthenticated={isAuthenticated} />} />
            <Route
              path="/profile"
              element={isAuthenticated ? <Profile /> : <Navigate to="/login" />}
            />
            <Route
              path="/add-event"
              element={isAuthenticated ? <AddEvent /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin"
              element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" />}
            />
            <Route
              path="/event/:id/register"
              element={isAuthenticated ? <EventRegister /> : <Navigate to="/login" />}
            />
            <Route
              path="/edit-event/:id"
              element={isAuthenticated ? <EditEvent /> : <Navigate to="/login" />}
            />
            <Route
              path="/refund/:ticketId"
              element={isAuthenticated ? <Refund /> : <Navigate to="/login" />}
            />
            <Route path="/check-ticket" element={<CheckTicket />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/map" element={<MapView />} />

            {/* Кастомная страница 404 для всех неизвестных путей */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </BrowserRouter>
  );
}

export default App;
