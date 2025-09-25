import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="footer-logo" aria-hidden="true">🧪</div>
          <div>
            <div className="footer-title">Clinical Trial Manager</div>
            <div className="footer-subtext">Manage trials securely and efficiently</div>
          </div>
        </div>

        <div className="footer-links">
          <a href="/trials" className="footer-link">All Trials</a>
          <a href="/login" className="footer-link">Login</a>
          <a href="/register" className="footer-link">Register</a>
        </div>

        <div className="footer-meta">© {year} Clinical Trial Manager</div>
      </div>
    </footer>
  );
};

export default Footer;
