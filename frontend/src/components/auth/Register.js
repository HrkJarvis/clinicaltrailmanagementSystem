import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register, error, clearError, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'researcher',
    department: '',
  });

  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    clearError();
    setLocalError(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const required = ['username','email','password','firstName','lastName'];
    for (const field of required) {
      if (!formData[field]) {
        setLocalError('Please fill in all required fields');
        return;
      }
    }

    const result = await register(formData);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="container main-content" style={{ maxWidth: 640 }}>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Register</h2>
          <p className="card-subtitle">Create a new account</p>
        </div>
        {(localError || error) && (
          <div className="alert alert-error mb-2">{localError || error}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">First Name</label>
              <input id="firstName" name="firstName" className="form-control" value={formData.firstName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="lastName">Last Name</label>
              <input id="lastName" name="lastName" className="form-control" value={formData.lastName} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input id="username" name="username" className="form-control" value={formData.username} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="form-control" value={formData.email} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" className="form-control" value={formData.password} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="role">Role</label>
              <select id="role" name="role" className="form-select" value={formData.role} onChange={handleChange}>
                <option value="researcher">Researcher</option>
                <option value="coordinator">Coordinator</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="department">Department (optional)</label>
            <input id="department" name="department" className="form-control" value={formData.department} onChange={handleChange} />
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register'}
            </button>
            <div>
              <span className="text-muted">Already have an account? </span>
              <Link to="/login">Login</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
