import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, error, clearError, isLoading } = useAuth();

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

    const result = await login({ ...formData, portal: 'user' });
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="container main-content" style={{ maxWidth: 520 }}>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Login</h2>
          <p className="card-subtitle">Access your account</p>
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
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            <div>
              <span className="text-muted">No account? </span>
              <Link to="/register">Register</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
