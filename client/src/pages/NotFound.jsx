import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    if (countdown === 0) {
      navigate('/');
    }

    return () => clearInterval(timer);
  }, [countdown, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '80vh', 
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '120px', margin: '0', color: 'var(--primary)', fontWeight: '800' }}>404</h1>
      <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>{t('page_not_found') || 'Упс! Страница не найдена'}</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '500px', marginBottom: '10px', fontSize: '18px' }}>
        {t('not_found_desc') || 'Похоже, вы зашли не туда. Но не волнуйтесь, все дороги ведут в ExploreCity!'}
      </p>
      <p style={{ color: 'var(--text-color)', fontWeight: 'bold', marginBottom: '40px', fontSize: '16px' }}>
        Перенаправление на главную через {countdown} сек...
      </p>
      <Link to="/" className="btn-primary" style={{ padding: '15px 40px', fontSize: '18px', textDecoration: 'none' }}>
        <i className="fas fa-home"></i> {t('back_to_home') || 'Перейти сейчас'}
      </Link>
    </div>
  );
}

export default NotFound;
