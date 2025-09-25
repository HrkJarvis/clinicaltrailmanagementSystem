import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminLogin from './components/auth/AdminLogin';
import Dashboard from './components/Dashboard';
import TrialsList from './components/trials/TrialsList';
import TrialForm from './components/trials/TrialForm';
import './index.css';


const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading"><div className="spinner" /></div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const Home = () => (
  <div className="home">
    <section className="hero-section">
      <div className="container">
        <div className="hero-inner">
          <div className="hero-badge">Secure • Efficient • Compliant</div>
          <h1 className="hero-title">Clinical Trials Management System</h1>
          <p className="hero-subtitle">Streamline study setup, tracking, and reporting for your research teams.</p>
          <div className="hero-ctas">
            <a href="/login" className="btn btn-primary">User Login</a>
          </div>
        </div>
      </div>
      <div className="hero-bg" aria-hidden="true" />
    </section>

    <section className="features-section">
      <div className="container">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Trial Oversight</h3>
            <p className="feature-text">Create, update, and track clinical trials with role-based access control.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🗂️</div>
            <h3 className="feature-title">Smart Filters</h3>
            <p className="feature-text">Filter by status, phase, therapeutic area, and search across key fields.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3 className="feature-title">Data Integrity</h3>
            <p className="feature-text">Strict validation on dates and enrollment to keep data consistent.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trials"
            element={
              <ProtectedRoute>
                <TrialsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trials/new"
            element={
              <ProtectedRoute>
                <TrialForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trials/:id/edit"
            element={
              <ProtectedRoute>
                <TrialForm editMode />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </AuthProvider>
  );
}

export default App;
