import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Header.css';

function Header({ isAuthenticated, onLogout }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-mode');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const currentLang = i18n.language;

  return (
    <header className="header glass-card">
      <div className="header-content container">
        <Link to="/" className="logo" onClick={() => setIsMenuOpen(false)}>
          Explore<span>City</span>
        </Link>
        <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
           <i className={isMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
        </button>
        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/" onClick={() => setIsMenuOpen(false)}>{t('home')}</Link>
          <Link to="/events" onClick={() => setIsMenuOpen(false)}>{t('events')}</Link>
          <Link to="/map" onClick={() => setIsMenuOpen(false)}>{t('map') || 'Map'}</Link>

          {isAuthenticated ? (
            <>
              {JSON.parse(localStorage.getItem('user') || '{}').role === 'admin' && (
                <>
                  <Link to="/admin" style={{ color: '#e74c3c', fontWeight: '800' }} onClick={() => setIsMenuOpen(false)}>{t('admin_link')}</Link>
                  <Link to="/add-event" onClick={() => setIsMenuOpen(false)}>{t('add_event')}</Link>
                </>
              )}
              <Link to="/profile" onClick={() => setIsMenuOpen(false)}>{t('profile')}</Link>
              <button
                className="btn-link"
                onClick={() => { onLogout(); navigate('/'); setIsMenuOpen(false); }}
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>{t('login')}</Link>
              <Link to="/register" className="btn-primary" style={{ padding: '8px 20px' }} onClick={() => setIsMenuOpen(false)}>
                {t('register')}
              </Link>
            </>
          )}

          <div className="lang-switcher">
            <button onClick={() => { toggleTheme(); setIsMenuOpen(false); }} className="theme-toggle" style={{ background: 'none', border: 'none', padding: '0 10px', fontSize: '20px', cursor: 'pointer' }}>
              {isDark ? '☀️' : '🌙'}
            </button>
            <button className={currentLang === 'kz' ? 'active' : ''} onClick={() => { changeLanguage('kz'); setIsMenuOpen(false); }}>KZ</button>
            <button className={currentLang === 'ru' ? 'active' : ''} onClick={() => { changeLanguage('ru'); setIsMenuOpen(false); }}>RU</button>
            <button className={currentLang === 'en' ? 'active' : ''} onClick={() => { changeLanguage('en'); setIsMenuOpen(false); }}>EN</button>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
