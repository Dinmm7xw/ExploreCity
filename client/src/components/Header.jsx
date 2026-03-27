import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Header.css';

function Header({ isAuthenticated, onLogout }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

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
        <Link to="/" className="logo">
          Explore<span>City</span>
        </Link>
        <nav className="nav-links">
          <Link to="/">{t('home')}</Link>
          <Link to="/events">{t('events')}</Link>
          <Link to="/map">{t('map') || 'Map'}</Link>

          {isAuthenticated ? (
            <>
              {JSON.parse(localStorage.getItem('user') || '{}').role === 'admin' && (
                <>
                  <Link to="/admin" style={{ color: '#e74c3c', fontWeight: '800' }}>{t('admin_link')}</Link>
                  <Link to="/add-event">{t('add_event')}</Link>
                </>
              )}
              <Link to="/profile">{t('profile')}</Link>
              <button
                className="btn-link"
                onClick={() => { onLogout(); navigate('/'); }}
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login">{t('login')}</Link>
              <Link to="/register" className="btn-primary" style={{ padding: '8px 20px' }}>
                {t('register')}
              </Link>
            </>
          )}

          <div className="lang-switcher">
            <button onClick={toggleTheme} className="theme-toggle" style={{ background: 'none', border: 'none', padding: '0 10px', fontSize: '20px', cursor: 'pointer' }}>
              {isDark ? '☀️' : '🌙'}
            </button>
            <button className={currentLang === 'kz' ? 'active' : ''} onClick={() => changeLanguage('kz')}>KZ</button>
            <button className={currentLang === 'ru' ? 'active' : ''} onClick={() => changeLanguage('ru')}>RU</button>
            <button className={currentLang === 'en' ? 'active' : ''} onClick={() => changeLanguage('en')}>EN</button>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
