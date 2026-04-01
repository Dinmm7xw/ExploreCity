import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';

function EventDetails({ isAuthenticated }) {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/events/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Ошибка загрузки');
      setEvent(data);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/events/${id}/reviews`);
      if (res.ok) setReviews(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  const fetchWeather = useCallback(async (evt) => {
    try {
      const lat = evt.latitude || 43.2389;
      const lon = evt.longitude || 76.8897;
      let date = evt.date; 
      if (!date) return;
      if (date.includes(' ')) date = date.split(' ')[0];
      if (date.includes('T')) date = date.split('T')[0];
      
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max&timezone=auto&start_date=${date}&end_date=${date}`);
      const data = await res.json();
      if (data && data.daily && data.daily.temperature_2m_max) {
        setWeather({
          temp: data.daily.temperature_2m_max[0],
          code: data.daily.weathercode[0]
        });
      }
    } catch (err) {
      console.error('Weather Fetch Error:', err);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      const evt = await fetchEvent();
      if (evt && evt.sessions && evt.sessions.length > 0) {
        const masterAsSession = {
          id: 'master',
          city: evt.city,
          location: evt.location,
          date: evt.date,
          time: evt.time || '',
          latitude: evt.latitude,
          longitude: evt.longitude
        };
        const isDuplicate = evt.sessions.some(s => s.city === evt.city && s.location === evt.location && s.date === evt.date);
        let newSessions = [...evt.sessions];
        if (!isDuplicate) {
          newSessions = [masterAsSession, ...newSessions];
        }
        evt.sessions = newSessions;
        setEvent({...evt});
        setSelectedSession(newSessions[0]);
      } else if (evt) {
        setSelectedSession({
            id: 'master',
            city: evt.city,
            location: evt.location,
            date: evt.date,
            time: evt.time || '',
            latitude: evt.latitude,
            longitude: evt.longitude
        });
      }
      await fetchReviews();
      if (evt) await fetchWeather(evt);
      setLoading(false);
    };
    loadAll();
  }, [id, fetchEvent, fetchReviews, fetchWeather]);

  const handleDelete = async () => {
    if (!window.confirm(t('delete_confirm'))) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert(t('success_deleted'));
      navigate('/events');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/${id}/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newReview)
      });
      if (res.ok) {
        setNewReview({ rating: 5, comment: '' });
        fetchReviews();
        const data = await res.json();
        setEvent({ ...event, rating: data.newRating });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="container" style={{padding:'100px', textAlign:'center'}}><div className="spinner"></div></div>;
  if (error) return <div className="container" style={{padding:'100px', textAlign:'center'}}><div className="glass-card" style={{padding:'40px'}}><h2 style={{color:'red'}}>{error}</h2><button className="btn-primary" style={{marginTop:'20px'}} onClick={() => navigate('/events')}>{t('back_to_home')}</button></div></div>;
  if (!event) return <div className="container" style={{padding:'100px', textAlign:'center'}}><h2>{t('no_events_found')}</h2></div>;

  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const canModify = user && user.role === 'admin';

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div className="mobile-h-250" style={{ position: 'relative', height: '400px', backgroundColor: '#f0f0f0', overflow: 'hidden' }}>
          {(() => {
            const isYt = event.image_url && (event.image_url.includes('youtube.com') || event.image_url.includes('youtu.be'));
            const ytId = isYt ? event.image_url.match(/(?:youtu\.be\/|youtube\.com\/(?:v\/|u\/\w\/|embed\/|watch\?v=))([^#&?]*)/)?.[1] : null;

            if (ytId) {
              return (
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&modestbranding=1&rel=0`} 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  style={{ pointerEvents: 'none', transform: 'scale(1.5)', border: 'none' }}
                ></iframe>
              );
            } else {
              return (
                <img 
                  src={event.image_url || 'https://picsum.photos/1200/600?random'} 
                  alt={event.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => e.target.src = 'https://picsum.photos/1200/600?random'}
                />
              );
            }
          })()}
          <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
            <i className="fas fa-robot"></i> {t('ai_generated')}
          </div>
        </div>
        
        <div className="mobile-p-20" style={{ padding: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '36px', marginBottom: '16px', color: 'var(--text-main)' }}>{event.title}</h1>
              <div className="stack-mobile" style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <span style={{background: 'rgba(193, 123, 76, 0.1)', padding: '8px 16px', borderRadius: '20px', color: 'var(--primary)', fontWeight: 'bold'}}><i className="fas fa-tag"></i> {event.category}</span>
                <span style={{background: '#ffd966', padding: '8px 16px', borderRadius: '20px', color: '#000', fontWeight: 'bold'}}><i className="fas fa-star"></i> {event.rating}</span>
                {weather && (
                  <span style={{background: 'rgba(52, 152, 219, 0.1)', padding: '8px 16px', borderRadius: '20px', color: '#2980b9', fontWeight: 'bold'}}>
                    <i className={weather.code <= 3 ? "fas fa-sun" : "fas fa-cloud"}></i> {weather.temp}°C
                  </span>
                )}
              </div>
            </div>
            {isAuthenticated && (
              <button 
                className="btn-primary" 
                style={{ background: '#2ecc71', color: 'white', padding: '15px 30px' }} 
                onClick={() => navigate(selectedSession && selectedSession.id !== 'master' ? `/event/${id}/register?session=${selectedSession.id}` : `/event/${id}/register`)}
              >
                <i className="fas fa-ticket-alt"></i> {t('book_ticket')}
              </button>
            )}
          </div>

          {event.sessions && event.sessions.length > 0 && (
            <div style={{ marginBottom: '30px', background: 'rgba(0,0,0,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid #eee' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '16px' }}><i className="far fa-clock" style={{color: 'var(--primary)'}}></i> {t('select_sector_seat')}</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {event.sessions.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setSelectedSession(s)}
                    style={{ 
                      padding: '12px 20px', 
                      borderRadius: '12px', 
                      border: selectedSession?.id === s.id ? '2px solid var(--primary)' : '1px solid #ddd',
                      background: selectedSession?.id === s.id ? 'rgba(193, 123, 76, 0.05)' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: '0.2s',
                      boxShadow: selectedSession?.id === s.id ? '0 4px 10px rgba(193, 123, 76, 0.15)' : 'none'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: selectedSession?.id === s.id ? 'var(--primary)' : '#333' }}>{s.date} • {s.time}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}><i className="fas fa-map-marker-alt"></i> {s.city}, {s.location}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '30px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '30px' }}>
            <h3 style={{ fontSize: '24px', marginBottom: '15px' }}>{t('description_label')}</h3>
            <div style={{ fontSize: '18px', color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '40px' }}>
                {event.description || t('no_description')}
            </div>
          </div>

          <div style={{ marginBottom: '40px', borderRadius: '16px', overflow: 'hidden' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '20px' }}><i className="fas fa-map-marked-alt" style={{color: 'var(--primary)'}}></i> {t('location_on_map')}</h3>
            {(() => {
              const activeLat = selectedSession ? selectedSession.latitude : event.latitude;
              const activeLng = selectedSession ? selectedSession.longitude : event.longitude;
              const activeCity = selectedSession ? selectedSession.city : event.city;
              const activeLoc = selectedSession ? selectedSession.location : event.location;

              return activeLat && activeLng ? (
                <iframe 
                  key={`${activeLat}-${activeLng}`}
                  src={`https://yandex.ru/map-widget/v1/?ll=${activeLng},${activeLat}&z=16&pt=${activeLng},${activeLat},pm2rdm`} 
                  width="100%" height="350" frameBorder="0" style={{ borderRadius: '12px', border: '1px solid #eee' }}>
                </iframe>
              ) : (
                <iframe 
                  key={`${activeCity}-${activeLoc}`}
                  src={`https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(activeCity + ', ' + activeLoc)}&z=16`} 
                  width="100%" height="350" frameBorder="0" style={{ borderRadius: '12px', border: '1px solid #eee' }}>
                </iframe>
              );
            })()}
          </div>

          {canModify && (
            <div className="stack-mobile" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid #eee', paddingTop: '30px' }}>
              <button className="btn-primary" style={{ background: '#f39c12', display: 'flex', justifyContent: 'center' }} onClick={() => navigate(`/edit-event/${id}`)}>
                <i className="fas fa-edit"></i> {t('edit_btn')}
              </button>
              <button className="btn-primary" style={{ background: '#e74c3c', display: 'flex', justifyContent: 'center' }} onClick={handleDelete}>
                <i className="fas fa-trash"></i> {t('delete_btn')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '40px', marginTop: '40px' }}>
        <h3 style={{ fontSize: '24px', marginBottom: '24px' }}><i className="fas fa-comments" style={{ color: 'var(--primary)' }}></i> {t('reviews_title')} ({reviews.length})</h3>
        {isAuthenticated && (
          <form onSubmit={handleReviewSubmit} style={{ marginBottom: '40px', background: 'rgba(0,0,0,0.02)', padding: '20px', borderRadius: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <span style={{ fontWeight: 'bold' }}>{t('rating_stars')}:</span>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <i key={star} className={star <= newReview.rating ? "fas fa-star" : "far fa-star"} style={{ color: '#f1c40f', cursor: 'pointer', fontSize: '20px' }} onClick={() => setNewReview({ ...newReview, rating: star })}></i>
                ))}
              </div>
            </div>
            <textarea className="input-field" placeholder={t('comment_placeholder')} style={{ minHeight: '80px', marginBottom: '15px' }} value={newReview.comment} onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} required></textarea>
            <button type="submit" className="btn-primary" style={{ padding: '10px 30px' }}>{t('add_review_btn')}</button>
          </form>
        )}
        <div style={{ display: 'grid', gap: '20px' }}>
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>{t('no_reviews')}</p>
          ) : (
            reviews.map(rev => (
              <div key={rev.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>{rev.user_name}</span>
                  <div style={{ color: '#f1c40f' }}>{[...Array(5)].map((_, i) => (<i key={i} className={i < rev.rating ? "fas fa-star" : "far fa-star"}></i>))}</div>
                </div>
                <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '15px' }}>{rev.comment}</p>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>{new Date(rev.created_at).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default EventDetails;
