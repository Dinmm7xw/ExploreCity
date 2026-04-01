import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';

function EventRegister() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session');

  const [event, setEvent] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [formData, setFormData] = useState({ tickets: 1, phone: '', seats: '' });
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeSector, setActiveSector] = useState(null); // 'A', 'B', 'C', 'D'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Новые состояния для оплаты
  const [step, setStep] = useState(1); // 1 - Данные, 2 - Оплата
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' или 'qr'
  const [isProcessing, setIsProcessing] = useState(false);

  const TICKET_PRICE = 5000; // Условная цена за один билет
  const totalPrice = (selectedSeats.length || formData.tickets) * TICKET_PRICE;

  useEffect(() => {
    fetch(`${API_URL}/api/events/${id}`)
      .then(res => res.json())
      .then(data => {
        setEvent(data);
        if (sessionId && data.sessions) {
          const s = data.sessions.find(s => s.id.toString() === sessionId);
          if (s) setSessionData(s);
        }
      })
      .catch(err => console.error(err));
  }, [id, sessionId]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, tickets: selectedSeats.length || (prev.tickets || 1), seats: selectedSeats.join(', ') }));
  }, [selectedSeats]);

  const toggleSeat = (seatCode) => {
    if (selectedSeats.includes(seatCode)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatCode));
    } else {
      if (selectedSeats.length >= 10) {
        alert(t('limit_tickets'));
        return;
      }
      setSelectedSeats([...selectedSeats, seatCode]);
    }
  };

  const isSeatingEvent = event && (sessionData ? sessionData.location : event.location)?.includes('Астана Арена');

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!formData.phone) {
        setError(t('enter_phone'));
        return;
    }
    if (isSeatingEvent && selectedSeats.length === 0) {
        setError(t('select_at_least_one'));
        return;
    }
    setError('');
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    setIsProcessing(true);
    setError('');

    // Имитация задержки платежной системы
    setTimeout(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/events/${id}/register`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ 
                tickets: formData.tickets, 
                phone: formData.phone, 
                seats: selectedSeats.join(', '),
                session_id: sessionId || null 
              })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            alert(t('payment_success'));
            navigate(`/event/${id}`);
          } catch (err) {
            setError(err.message);
            setIsProcessing(false);
          } finally {
            setLoading(false);
          }
    }, 2000);
  };

  if (!event) return <div style={{textAlign: 'center', marginTop: '100px'}}>{t('loading')}</div>;

  return (
    <div className="container" style={{ padding: '60px 20px', minHeight: '70vh' }}>
      <div className="glass-card mobile-p-20" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px', position: 'relative' }}>
        
        {step === 2 && (
            <button 
                onClick={() => setStep(1)} 
                style={{ position: 'absolute', left: '20px', top: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
                <i className="fas fa-arrow-left"></i> {t('back_btn')}
            </button>
        )}

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
                <div style={{ width: '50px', height: '2px', background: step === 2 ? 'var(--primary)' : '#eee', alignSelf: 'center' }}></div>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: step === 2 ? 'var(--primary)' : '#eee', color: step === 2 ? 'white' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
            </div>
            <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>
                {step === 1 ? t('booking_tickets') : t('payment_order')}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>{event.title}</p>
        </div>

        {step === 1 ? (
            <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: isSeatingEvent ? '1fr 1fr' : '1fr', gap: '40px' }}>
                {/* Карта/Схема */}
                {isSeatingEvent && (
                    <div className="mobile-p-0" style={{ borderRight: '1px solid rgba(0,0,0,0.05)', paddingRight: '40px' }}>
                        <h3 style={{ fontSize: '18px', marginBottom: '20px' }}><i className="fas fa-couch" style={{color: 'var(--primary)'}}></i> {t('select_sector_seat')}</h3>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <svg viewBox="0 0 240 160" style={{ width: '100%', maxWidth: '400px', cursor: 'pointer' }}>
                                <rect x="70" y="50" width="100" height="60" fill="#4CAF50" rx="2" />
                                <rect x="75" y="55" width="90" height="50" fill="none" stroke="white" strokeWidth="0.5" />
                                <circle cx="120" cy="80" r="10" fill="none" stroke="white" strokeWidth="0.5" />
                                <path d="M50,15 L190,15 L170,45 L70,45 Z" fill={activeSector?.startsWith('W') ? 'var(--primary)' : '#ff6b6b'} onClick={() => setActiveSector('W-Sector')} />
                                <text x="120" y="32" fontSize="7" textAnchor="middle" fill="white" fontWeight="bold">WEST (W1-W9)</text>
                                <path d="M50,145 L190,145 L170,115 L70,115 Z" fill={activeSector?.startsWith('E') ? 'var(--primary)' : '#ff6b6b'} onClick={() => setActiveSector('E-Sector')} />
                                <text x="120" y="132" fontSize="7" textAnchor="middle" fill="white" fontWeight="bold">EAST (E1-E9)</text>
                                <path d="M15,40 L45,55 L45,105 L15,120 Z" fill={activeSector?.startsWith('S') ? 'var(--primary)' : '#ff6b6b'} onClick={() => setActiveSector('S-Sector')} />
                                <text x="30" y="80" fontSize="7" textAnchor="middle" fill="white" fontWeight="bold" transform="rotate(-90, 30, 80)">SOUTH (S1-S7)</text>
                                <path d="M225,40 L195,55 L195,105 L225,120 Z" fill={activeSector?.startsWith('N') ? 'var(--primary)' : '#ff6b6b'} onClick={() => setActiveSector('N-Sector')} />
                                <text x="210" y="80" fontSize="7" textAnchor="middle" fill="white" fontWeight="bold" transform="rotate(90, 210, 80)">NORTH (N1-N7)</text>
                            </svg>
                        </div>

                        {activeSector ? (
                            <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                                    {[...Array(24)].map((_, idx) => {
                                        const seatNumber = idx + 1;
                                        const row = Math.ceil(seatNumber / 6);
                                        const seat = seatNumber % 6 || 6;
                                        const seatCode = `${activeSector.substring(0,1)}-R${row}-${seat}`;
                                        const isSelected = selectedSeats.includes(seatCode);
                                        return (
                                            <div key={seatCode} onClick={() => toggleSeat(seatCode)} style={{ height: '35px', background: isSelected ? 'var(--primary)' : 'white', border: `1px solid ${isSelected ? 'var(--primary)' : '#eee'}`, borderRadius: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isSelected ? 'white' : '#555', transition: '0.2s' }}>{seat}</div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(0,0,0,0.02)', borderRadius: '16px', border: '2px dashed rgba(0,0,0,0.05)' }}>
                                {t('select_sector_hint')}
                            </div>
                        )}
                    </div>
                )}

                {/* Поля ввода */}
                <div>
                    <div style={{ background: 'rgba(193, 123, 76, 0.05)', padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '12px' }}><i className="fas fa-info-circle"></i> {t('order_info')}</h3>
                        <p style={{ fontSize: '14px', marginBottom: '8px' }}><strong>{t('city_label').replace('*', '')}:</strong> {sessionData ? sessionData.city : event.city}</p>
                        <p style={{ fontSize: '14px', marginBottom: '8px' }}><strong>{t('location_label').replace('*', '')}:</strong> {sessionData ? sessionData.location : event.location}</p>
                        <p style={{ fontSize: '14px', marginBottom: '8px' }}><strong>{t('date_label')}:</strong> {sessionData ? sessionData.date : (event.date || t('coming_soon'))} {t('time_label')} {sessionData ? sessionData.time : (event.time || '')}</p>
                        <p style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 'bold', marginTop: '10px' }}>{t('price_label')} {TICKET_PRICE.toLocaleString()} ₸</p>
                    </div>

                    {error && <div className="error-msg" style={{marginBottom: '20px'}}>{error}</div>}

                    <form onSubmit={handleNextStep} style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>{t('phone_label')}</label>
                            <input type="text" className="input-field" placeholder="+7 (777) 000-00-00" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                        </div>
                        {!isSeatingEvent ? (
                            <div>
                                <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>{t('ticket_count_label')}</label>
                                <input type="number" className="input-field" min="1" max="10" value={formData.tickets} onChange={(e) => setFormData({...formData, tickets: parseInt(e.target.value)})} />
                            </div>
                        ) : (
                            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '16px', border: '1px solid #eee' }}>
                                <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)' }}>{t('selected_seats_count')} {selectedSeats.length}</p>
                                <p style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>{selectedSeats.length > 0 ? selectedSeats.join(', ') : t('seats_not_selected')}</p>
                            </div>
                        )}
                        <button type="submit" className="btn-primary" style={{justifyContent: 'center', padding: '16px', fontSize: '16px'}}>
                            {t('continue_payment')} ({totalPrice.toLocaleString()} ₸)
                        </button>
                    </form>
                </div>
            </div>
        ) : (
            /* ШАГ 2: ОПЛАТА */
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                {isProcessing ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div className="spinner" style={{ width: '60px', height: '60px', borderWidth: '5px', margin: '0 auto 20px' }}></div>
                        <h3>{t('processing_payment')}</h3>
                        <p style={{ color: 'var(--text-muted)' }}>{t('dont_close_page')}</p>
                    </div>
                ) : (
                    <>
                        <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '20px', borderRadius: '16px', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>{t('order_label')}</span>
                                <strong>#{Math.floor(Math.random() * 100000)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                <span>{t('to_pay')}</span>
                                <span>{totalPrice.toLocaleString()} ₸</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                            <button 
                                onClick={() => setPaymentMethod('card')}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `2px solid ${paymentMethod === 'card' ? 'var(--primary)' : '#eee'}`, background: paymentMethod === 'card' ? 'rgba(193,123,76,0.05)' : 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                <i className="fas fa-credit-card"></i> {t('card')}
                            </button>
                            <button 
                                onClick={() => setPaymentMethod('qr')}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `2px solid ${paymentMethod === 'qr' ? 'var(--primary)' : '#eee'}`, background: paymentMethod === 'qr' ? 'rgba(193,123,76,0.05)' : 'white', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                <i className="fas fa-qrcode"></i> {t('kaspi_qr')}
                            </button>
                        </div>

                        {paymentMethod === 'card' ? (
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <input type="text" className="input-field" placeholder="0000 0000 0000 0000" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <input type="text" className="input-field" placeholder="ММ / ГГ" />
                                    <input type="text" className="input-field" placeholder="CVC" />
                                </div>
                                <p style={{ fontSize: '11px', color: '#999', textAlign: 'center' }}>{t('ssl_hint')}</p>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #eee' }}>
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KaspiPay" alt="Kaspi QR" style={{ width: '150px', marginBottom: '15px' }} />
                                <p style={{ fontWeight: 'bold' }}>{t('scan_kaspi_hint')}</p>
                            </div>
                        )}

                        <button 
                            onClick={handleSubmit} 
                            className="btn-primary" 
                            style={{ width: '100%', padding: '18px', fontSize: '18px', marginTop: '30px', justifyContent: 'center' }}
                        >
                            {t('pay_btn')} {totalPrice.toLocaleString()} ₸
                        </button>
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
}

export default EventRegister;

