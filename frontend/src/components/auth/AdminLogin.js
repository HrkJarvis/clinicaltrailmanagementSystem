import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, logout, error, clearError, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    clearError();
    setLocalError(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.emailOrUsername || !formData.password) {
      setLocalError('Please fill in all fields');
      return;
    }

    const result = await login(formData);
    if (result.success) {
      if (result.user?.role === 'admin') {
        navigate('/dashboard');
      } else {
        // Non-admin tried to login via admin portal -> log out that session and show error
        await logout();
        setLocalError('This portal is for Admin only. Please use the user login instead.');
      }
    }
  };

  return (
    <div className="container main-content" style={{ maxWidth: 520 }}>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Admin Login</h2>
          <p className="card-subtitle">Administrators only</p>
        </div>

        {(localError || error) && (
          <div className="alert alert-error mb-2">{localError || error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="emailOrUsername">Email or Username</label>
            <input
              id="emailOrUsername"
              name="emailOrUsername"
              type="text"
              className="form-control"
              value={formData.emailOrUsername}
              onChange={handleChange}
              placeholder="Enter email or username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
            />
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login as Admin'}
            </button>
            <div>
              <span className="text-muted">User? Go to </span>
              <a href="/login">User Login</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
