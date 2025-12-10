import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      // ignore; AuthContext handles errors elsewhere
      navigate('/login');
    }
  };

  return (
    <header className="nav">
      <div className="nav__logo">GameHub</div>
      <nav className="nav__links">
        <a href="/">Home</a>
        <a href="/games">Browse</a>
        <a href="/cart">Cart</a>
        <a href="/">Language</a>
        <a href="/">Help &amp; Contact</a>
      </nav>
      <div className="nav__actions">
        {!loading && (
          isAuthenticated ? (
            <button className="nav__login" onClick={handleLogout}>Logout</button>
          ) : (
            <a className="nav__login" href="/login">Login</a>
          )
        )}
        <div className="nav__avatar">
          <span>👤</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
