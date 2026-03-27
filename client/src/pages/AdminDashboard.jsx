import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';

function AdminDashboard() {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      alert(t('ai_error') || 'Нет доступа!'); 
      navigate('/');
      return;
    }

    fetchEvents();
    fetchRefundRequests();
  }, [navigate]);

  const fetchRefundRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/admin/refunds`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setRefundRequests(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events`);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('delete_confirm'))) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefundAction = async (id, action) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/admin/refunds/${id}/action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        fetchRefundRequests();
        alert(action === 'approve' ? 'Возврат одобрен' : 'Возврат отклонен');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{textAlign: 'center', marginTop: '100px'}}>{t('loading')}</div>;

  return (
    <div className="container" style={{ padding: '40px 20px', minHeight: '80vh' }}>
      <div className="section-title">
        <h2>{t('role_admin')} Board</h2>
        <div className="title-underline"></div>
      </div>
      
      <div className="glass-card" style={{ padding: '30px' }}>
        <h3>Управление мероприятиями ({events.length})</h3>
        <div style={{ marginTop: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
                <th style={{ padding: '12px' }}>ID</th>
                <th style={{ padding: '12px' }}>Название</th>
                <th style={{ padding: '12px' }}>Город</th>
                <th style={{ padding: '12px' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '12px' }}>{ev.id}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{ev.title}</td>
                  <td style={{ padding: '12px' }}>{ev.city}</td>
                  <td style={{ padding: '12px' }}>
                    <button onClick={() => navigate(`/event/${ev.id}`)} style={{ marginRight: '8px', padding: '6px 10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>👁️</button>
                    <button onClick={() => navigate(`/edit-event/${ev.id}`)} style={{ marginRight: '8px', padding: '6px 10px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => handleDelete(ev.id)} style={{ padding: '6px 10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '30px', marginTop: '40px' }}>
        <h3 style={{ color: '#e74c3c' }}>
          <i className="fas fa-hand-holding-usd"></i> Запросы на возврат ({refundRequests.length})
        </h3>
        <div style={{ marginTop: '20px', overflowX: 'auto' }}>
          {refundRequests.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Нет активных запросов на возврат</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
                  <th style={{ padding: '12px' }}>Билет #</th>
                  <th style={{ padding: '12px' }}>Пользователь</th>
                  <th style={{ padding: '12px' }}>Мероприятие</th>
                  <th style={{ padding: '12px' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {refundRequests.map(req => (
                  <tr key={req.ticket_id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <td style={{ padding: '12px' }}>{req.ticket_id}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold' }}>{req.user_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{req.user_email}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div>{req.event_title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{req.date}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        onClick={() => handleRefundAction(req.ticket_id, 'approve')} 
                        style={{ marginRight: '8px', padding: '6px 12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Одобрить
                      </button>
                      <button 
                        onClick={() => handleRefundAction(req.ticket_id, 'reject')} 
                        style={{ padding: '6px 12px', background: 'none', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Отклонить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
