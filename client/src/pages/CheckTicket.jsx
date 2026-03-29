import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';

function CheckTicket() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const ticketId = searchParams.get('id');
  const userId = searchParams.get('user');

  useEffect(() => {
    const verifyTicket = async () => {
      try {
        const res = await fetch(`${API_URL}/api/events/check/validate?id=${ticketId}&user=${userId}`);
        const data = await res.json();
        setResult(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (ticketId && userId) {
      verifyTicket();
    } else {
      setLoading(false);
    }
  }, [ticketId, userId]);

  if (loading) return <div className="container" style={{padding: '100px', textAlign: 'center'}}>{t('loading')}</div>;

  if (!result) {
    return (
      <div className="container" style={{padding: '100px', textAlign: 'center'}}>
        <h2 style={{color: '#e74c3c'}}>{t('invalid_qr') || 'Некорректный QR-код'}</h2>
        <Link to="/" className="btn-primary" style={{marginTop: '20px', display: 'inline-block'}}>{t('back_to_home')}</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '600px' }}>
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center', borderTop: result.valid ? '10px solid #2ecc71' : '10px solid #e74c3c' }}>
        <div style={{ fontSize: '80px', color: result.valid ? '#2ecc71' : '#e74c3c', marginBottom: '20px' }}>
          <i className={result.valid ? "fas fa-check-circle" : "fas fa-times-circle"}></i>
        </div>
        
        <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>
          {result.valid ? (t('ticket_valid') || 'Билет действителен') : (t('ticket_invalid_status') || 'Билет недействителен')}
        </h2>
        
        {result.details && (
          <div style={{ textAlign: 'left', marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <p><strong>{t('visitor') || 'Посетитель'}:</strong> {result.details.user_name}</p>
            <p><strong>{t('event') || 'Событие'}:</strong> {result.details.title}</p>
            <p><strong>{t('date_time') || 'Дата и время'}:</strong> {result.details.session_date || result.details.date} | {result.details.session_time || result.details.time}</p>
            <p><strong>{t('location') || 'Место'}:</strong> {result.details.session_city || result.details.city}, {result.details.session_location || result.details.location}</p>
            <p><strong>{t('ticket_count_label') || 'Кол-во билетов'}:</strong> {result.details.tickets}</p>
            <p><strong>{t('status') || 'Статус'}:</strong> <span style={{ color: result.valid ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>{result.details.status}</span></p>
          </div>
        )}

        <Link to="/" className="btn-primary" style={{marginTop: '30px', display: 'inline-block'}}>{t('back_to_home')}</Link>
      </div>
    </div>
  );
}

export default CheckTicket;
