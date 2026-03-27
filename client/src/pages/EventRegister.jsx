import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';

function EventRegister() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({ tickets: 1, phone: '', seats: '' });
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeSector, setActiveSector] = useState(null); // 'A', 'B', 'C', 'D'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/events/${id}`)
      .then(res => res.json())
      .then(data => setEvent(data))
      .catch(err => console.error(err));
  }, [id]);

  useEffect(() => {
    setFormData({ ...formData, tickets: selectedSeats.length || 1, seats: selectedSeats.join(', ') });
  }, [selectedSeats]);

  const toggleSeat = (seatCode) => {
    if (selectedSeats.includes(seatCode)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatCode));
    } else {
      if (selectedSeats.length >= 10) {
        alert('Максимум 10 билетов на одного человека');
        return;
      }
      setSelectedSeats([...selectedSeats, seatCode]);
    }
  };

  const isSeatingEvent = event && event.location && event.location.includes('Астана Арена');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone) {
      setError('Пожалуйста, введите ваш номер телефона');
      return;
    }
    if (isSeatingEvent && selectedSeats.length === 0) {
        setError('Пожалуйста, выберите хотя бы одно место на схеме');
        return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/${id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tickets: formData.tickets, phone: formData.phone, seats: selectedSeats.join(', ') })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      alert(data.message || 'Сәтті тіркелдіңіз! (Вы успешно зарегистрированы)');
      navigate(`/event/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!event) return <div style={{textAlign: 'center', marginTop: '100px'}}>{t('loading')}</div>;

  return (
    <div className="container" style={{ padding: '60px 20px', minHeight: '70vh' }}>
      <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Бронирование билетов</h2>
            <p style={{ color: 'var(--text-muted)' }}>{event.title}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isSeatingEvent ? '1fr 1fr' : '1fr', gap: '40px' }}>
            
            {/* Левая колонка: Схема зала (если нужно) */}
            {isSeatingEvent && (
                <div style={{ borderRight: '1px solid rgba(0,0,0,0.05)', paddingRight: '40px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '20px' }}><i className="fas fa-couch" style={{color: 'var(--primary)'}}></i> Выберите сектор и место:</h3>
                    
                    {/* Визуальная схема секторов Астана Арена (SVG) */}
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <svg viewBox="0 0 240 160" style={{ width: '100%', maxWidth: '400px', cursor: 'pointer' }}>
                            {/* Фон поля */}
                            <rect x="70" y="50" width="100" height="60" fill="#4CAF50" rx="2" />
                            <rect x="75" y="55" width="90" height="50" fill="none" stroke="white" strokeWidth="0.5" />
                            <circle cx="120" cy="80" r="10" fill="none" stroke="white" strokeWidth="0.5" />
                            
                            {/* Сектора WEST (Top) */}
                            <path d="M50,15 L190,15 L170,45 L70,45 Z" fill={activeSector?.startsWith('W') ? 'var(--primary)' : '#ff6b6b'} onClick={() => setActiveSector('W-Sector')} />
                            <text x="120" y="32" fontSize="7" textAnchor="middle" fill="white" fontWeight="bold">WEST (W1-W9)</text>

                            {/* Сектора EAST (Bottom) */}
                            <path d="M50,145 L190,145 L170,115 L70,115 Z" fill={activeSector?.startsWith('E') ? 'var(--primary)' : '#ff6b6b'} onClick={() => setActiveSector('E-Sector')} />
                            <text x="120" y="132" fontSize="7" textAnchor="middle" fill="white" fontWeight="bold">EAST (E1-E9)</text>

                            {/* Сектора SOUTH (Left) */}
                            <path d="M15,40 L45,55 L45,105 L15,120 Z" fill={activeSector?.startsWith('S') ? 'var(--primary)' : '#ff6b6b'} onClick={() => setActiveSector('S-Sector')} />
                            <text x="30" y="80" fontSize="7" textAnchor="middle" fill="white" fontWeight="bold" transform="rotate(-90, 30, 80)">SOUTH (S1-S7)</text>

                            {/* Сектора NORTH (Right) */}
                            <path d="M225,40 L195,55 L195,105 L225,120 Z" fill={activeSector?.startsWith('N') ? 'var(--primary)' : '#ff6b6b'} onClick={() => setActiveSector('N-Sector')} />
                            <text x="210" y="80" fontSize="7" textAnchor="middle" fill="white" fontWeight="bold" transform="rotate(90, 210, 80)">NORTH (N1-N7)</text>

                            {/* Corners */}
                            <path d="M20,20 Q15,40 40,45 L50,15 Z" fill="#ff8e8e" onClick={() => setActiveSector('SW')} />
                            <text x="32" y="32" fontSize="5" fill="white">SW</text>

                            <path d="M220,20 Q225,40 200,45 L190,15 Z" fill="#ff8e8e" onClick={() => setActiveSector('NW')} />
                            <text x="210" y="32" fontSize="5" fill="white">NW</text>

                            <path d="M20,140 Q15,120 40,115 L50,145 Z" fill="#ff8e8e" onClick={() => setActiveSector('SE')} />
                            <text x="32" y="132" fontSize="5" fill="white">SE</text>

                            <path d="M220,140 Q225,120 200,115 L190,145 Z" fill="#ff8e8e" onClick={() => setActiveSector('NE')} />
                            <text x="210" y="132" fontSize="5" fill="white">NE</text>
                        </svg>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 'bold' }}>
                            <i className="fas fa-mouse-pointer"></i> {t('select_sector_hint') || 'Выберите трибуну на схеме'}
                        </p>
                    </div>

                    {/* Сетка мест для выбранного сектора */}
                    {activeSector ? (
                        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                            <h4 style={{ marginBottom: '15px', fontSize: '16px', color: 'var(--primary)' }}>
                                <i className="fas fa-chevron-right"></i> {activeSector.replace('-Sector', '')}: Выберите ряд и кресло
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                                {[...Array(24)].map((_, idx) => {
                                    const seatNumber = idx + 1;
                                    const row = Math.ceil(seatNumber / 6);
                                    const seat = seatNumber % 6 || 6;
                                    const seatCode = `${activeSector.substring(0,1)}-R${row}-${seat}`;
                                    const isSelected = selectedSeats.includes(seatCode);

                                    return (
                                        <div 
                                            key={seatCode}
                                            onClick={() => toggleSeat(seatCode)}
                                            style={{ 
                                                height: '35px', 
                                                background: isSelected ? 'var(--primary)' : 'white', 
                                                border: `1px solid ${isSelected ? 'var(--primary)' : '#eee'}`,
                                                borderRadius: '8px',
                                                fontSize: '11px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: isSelected ? 'white' : '#555',
                                                transition: '0.2s',
                                                boxShadow: isSelected ? '0 4px 10px rgba(193, 123, 76, 0.3)' : 'none'
                                            }}
                                            title={`Ряд ${row}, Место ${seat}`}
                                        >
                                            {seat}
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ marginTop: '15px', fontSize: '12px', color: '#888', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                <span><i className="fas fa-square" style={{color: '#f0f0f0'}}></i> Свободно</span>
                                <span><i className="fas fa-square" style={{color: 'var(--primary)'}}></i> Выбрано</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(0,0,0,0.02)', borderRadius: '16px', border: '2px dashed rgba(0,0,0,0.05)' }}>
                            <i className="fas fa-hand-pointer" style={{ fontSize: '30px', color: '#ccc', marginBottom: '10px', display: 'block' }}></i>
                            {t('select_sector_hint') || 'Сначала выберите трибуну на карте'}
                        </div>
                    )}
                </div>
            )}

            {/* Правая колонка: Форма и детали */}
            <div>
                <div style={{ background: 'rgba(193, 123, 76, 0.05)', padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '12px' }}><i className="fas fa-info-circle"></i> Детали бронирования</h3>
                    <p style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Город:</strong> {event.city}</p>
                    <p style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Место:</strong> {event.location}</p>
                    <p style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Дата:</strong> {event.date || 'Уточняется'} в {event.time || ''}</p>
                </div>

                {error && <div className="error-msg" style={{marginBottom: '20px'}}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                    <div>
                        <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>Ваш номер телефона *</label>
                        <input 
                            type="text" 
                            className="input-field" 
                            placeholder="+7 (777) 000-00-00" 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            required
                        />
                    </div>

                    {!isSeatingEvent ? (
                        <div>
                            <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>Количество билетов</label>
                            <input 
                                type="number" 
                                className="input-field" 
                                min="1" 
                                max="10"
                                value={formData.tickets}
                                onChange={(e) => setFormData({...formData, tickets: parseInt(e.target.value)})}
                            />
                        </div>
                    ) : (
                        <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '16px', border: '1px solid #eee' }}>
                            <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)' }}>Выбрано мест: {selectedSeats.length}</p>
                            <p style={{ fontSize: '13px', color: '#666', marginTop: '6px', fontStyle: 'italic', wordBreak: 'break-all' }}>
                                {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Места не выбраны'}
                            </p>
                            <input type="hidden" value={formData.seats} name="seats" />
                        </div>
                    )}

                    <button type="submit" className="btn-primary" style={{justifyContent: 'center', padding: '16px', fontSize: '16px', marginTop: '10px'}} disabled={loading}>
                        {loading ? <div className="spinner"></div> : 'Подтвердить и забронировать'}
                    </button>
                    
                    <button type="button" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', marginTop: '10px' }}>
                        Вернуться назад
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
}

export default EventRegister;
