import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';

function Refund() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    // В реальности здесь был бы запрос к API для получения деталей билета
    // Но для прототипа мы просто спрашиваем подтверждение
    setTicket({ id: ticketId });
  }, [ticketId]);

  const handleRefund = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/auth/tickets/${ticketId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to process refund');
      
      alert(t('refund_request_sent'));
      navigate('/profile');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '600px' }}>
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '60px', color: 'var(--primary)', marginBottom: '20px' }}>
          <i className="fas fa-undo-alt"></i>
        </div>
        <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>{t('refund_title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px', lineHeight: '1.6' }}>
          {t('refund_confirm_text', { id: ticketId })}
          <br />
          {t('refund_warning')}
        </p>

        <div style={{ display: 'flex', gap: '15px' }}>
            <button 
                onClick={handleRefund} 
                disabled={loading}
                className="btn-primary" 
                style={{ flex: 1, background: '#e74c3c' }}
            >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : t('confirm_refund_btn')}
            </button>
            <button 
                onClick={() => navigate(-1)} 
                className="btn-primary" 
                style={{ flex: 1, background: '#95a5a6' }}
            >
                {t('cancel_btn')}
            </button>
        </div>
      </div>
    </div>
  );
}

export default Refund;
