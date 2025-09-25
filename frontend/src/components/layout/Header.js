import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  MdScience, 
  MdDashboard, 
  MdList, 
  MdAdd, 
  MdPerson, 
  MdLogout,
  MdMenu,
  MdClose
} from 'react-icons/md';
import './Header.css';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  return (
    <header className="header">
      <nav className="navbar">
        <div className="container">
          {/* Brand Logo */}
          <Link 
            className="navbar-brand" 
            to={isAuthenticated ? '/dashboard' : '/'}
            onClick={closeMenu}
          >
            <MdScience className="brand-icon" />
            <span className="brand-text">Clinical Trial Manager</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <MdClose /> : <MdMenu />}
          </button>

          {/* Navigation Menu */}
          <div className={`navbar-menu ${isMenuOpen ? 'is-active' : ''}`}>
            <ul className="navbar-nav">
              {isAuthenticated ? (
                <>
                  <li className="nav-item">
                    <Link 
                      className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} 
                      to="/dashboard"
                      onClick={closeMenu}
                    >
                      <MdDashboard className="nav-icon" />
                      <span>Dashboard</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      className={`nav-link ${isActive('/trials') ? 'active' : ''}`} 
                      to="/trials"
                      onClick={closeMenu}
                    >
                      <MdList className="nav-icon" />
                      <span>All Trials</span>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      className={`nav-link ${isActive('/trials/new') ? 'active' : ''}`} 
                      to="/trials/new"
                      onClick={closeMenu}
                    >
                      <MdAdd className="nav-icon" />
                      <span>New Trial</span>
                    </Link>
                  </li>
                  <li className="nav-item nav-user">
                    <span className="user-info">
                      <MdPerson className="nav-icon" />
                      <span className="user-name">
                        {user?.firstName} {user?.lastName}
                      </span>
                      {user?.role && (
                        <span className="role-badge" title={`Role: ${user.role}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      )}
                    </span>
                  </li>
                  <li className="nav-item">
                    <button 
                      className="btn btn-outline logout-btn" 
                      onClick={handleLogout}
                    >
                      <MdLogout className="nav-icon" />
                      <span>Logout</span>
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link 
                      className="nav-link" 
                      to="/login"
                      onClick={closeMenu}
                    >
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      className="nav-link" 
                      to="/register"
                      onClick={closeMenu}
                    >
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Mobile Menu Overlay */}
          {isMenuOpen && (
            <div 
              className="mobile-menu-overlay"
              onClick={closeMenu}
            />
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
