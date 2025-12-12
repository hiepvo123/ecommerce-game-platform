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
      navigate('/login');
    }
  };

  return (
    <header className="nav">
      <div className="nav__logo" onClick={() => navigate('/')}>GameHub</div>

      <nav className="nav__links">
        <a href="/">Home</a>
        <a href="/games">Browse</a>
        <a href="/cart">Cart</a>
        <a href="/">Language</a>
        <a href="/">Help & Contact</a>
      </nav>

      <div className="nav__actions">
        {!loading && (
          isAuthenticated ? (
            <>
              <button className="nav__login" onClick={handleLogout}>Logout</button>

              {/* CLICK AVATAR -> PROFILE */}
              <div className="nav__avatar" onClick={() => navigate('/profile')}>
                <span>👤</span>
              </div>
            </>
          ) : (
            <a className="nav__login" href="/login">Login</a>
          )
        )}
      </div>
    </header>
  );
};

export default Navbar;
