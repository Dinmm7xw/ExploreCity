import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function AfishaCarousel() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const isAuthenticated = !!localStorage.getItem('token');
  
  useEffect(() => {
    fetch(`${API_URL}/api/events`)
      .then(res => res.json())
      .then(data => {
        const items = data.slice(0, 4);
        if (items.length > 0) {
           setFeatured([...items, ...items, ...items, ...items]); 
        }
      })
      .catch(e => console.error(e));
      
    if (isAuthenticated) fetchSavedIds();
  }, []);

  const fetchSavedIds = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/saved`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedIds(data.map(e => e.id));
      }
    } catch (err) {
      console.error('Fetch saved error:', err);
    }
  };

  const toggleSave = async (e, eventId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events/${eventId}/save`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.saved) {
          setSavedIds([...savedIds, eventId]);
        } else {
          setSavedIds(savedIds.filter(id => id !== eventId));
        }
      }
    } catch (err) {
      console.error('Toggle save error:', err);
    }
  };

  if (featured.length === 0) return null;

  return (
    <div style={{ padding: '60px 0 40px', background: 'var(--bg-color)', overflow: 'hidden' }}>
      <div className="container" style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '38px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {t('hot_tickets')}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>{t('hot_tickets_subtitle')}</p>
      </div>
      
      {/* Контейнер для слайдера, который выходит за рамки экрана */}
      <div style={{ position: 'relative', width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
        <div style={{ 
          display: 'flex', 
          width: 'max-content',
          animation: 'scroll 40s linear infinite', 
          gap: '24px', 
          padding: '20px 0'
        }}>
          <style>
            {`
              @keyframes scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(calc(-50% - 12px)); }
              }
              .featured-card:hover {
                transform: scale(1.02) translateY(-10px);
                box-shadow: 0 20px 40px rgba(193, 123, 76, 0.3) !important;
              }
              .featured-card:hover .hover-video {
                opacity: 1 !important;
              }
              .featured-card-link {
                flex: 0 0 550px;
              }
              @media (max-width: 768px) {
                .featured-card-link {
                  flex: 0 0 85vw;
                }
                .featured-card {
                  height: 280px !important;
                }
                .featured-title {
                  font-size: 20px !important;
                }
              }
            `}
          </style>
          {featured.map((ev, i) => {
            const getYouTubeId = (url) => {
              if (!url) return null;
              const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
              const match = url.match(regExp);
              return (match && match[2].length === 11) ? match[2] : null;
            };

            const ytId = getYouTubeId(ev.image_url);
            const cardImg = ytId 
              ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` 
              : (ev.image_url || `https://picsum.photos/600/800?random=${i}`);

            return (
              <Link key={i + '-' + ev.id} to={`/event/${ev.id}`} className="featured-card-link" style={{ textDecoration: 'none', color: 'white' }}>
                <div className="featured-card" style={{ 
                  height: '350px', 
                  borderRadius: '24px', 
                  overflow: 'hidden', 
                  position: 'relative',
                  backgroundImage: !ytId ? `url(${cardImg})` : 'none',
                  backgroundColor: ytId ? '#000' : 'transparent',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  transition: 'all 0.4s ease'
                }}>
                  {ytId && (
                    <div className="always-video" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                       <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&modestbranding=1&rel=0`} 
                        frameBorder="0" 
                        style={{ pointerEvents: 'none', transform: 'scale(1.5)' }}
                      ></iframe>
                    </div>
                  )}
                  {isAuthenticated && (
                    <button 
                      onClick={(e) => toggleSave(e, ev.id)}
                      style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'rgba(255,255,255,0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        transition: '0.3s'
                      }}
                    >
                      <i className={savedIds.includes(ev.id) ? "fas fa-heart" : "far fa-heart"} style={{ color: savedIds.includes(ev.id) ? '#e74c3c' : '#333', fontSize: '20px' }}></i>
                    </button>
                  )}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '40px 24px 30px', background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4) 60%, transparent)', zIndex: 2 }}>
                  <span style={{ background: 'var(--primary)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{ev.date || t('coming_soon')}</span>
                  <h3 className="featured-title" style={{ fontSize: '26px', margin: '14px 0 8px', fontWeight: '800', color: 'white', lineHeight: '1.2' }}>{ev.title}</h3>
                  <p style={{ fontSize: '15px', color: '#ddd' }}>
                    <i className="fas fa-location-dot"></i> {(() => {
                      const cities = new Set([ev.city]);
                      if (ev.sessions) ev.sessions.forEach(s => cities.add(s.city));
                      const citiesArr = Array.from(cities);
                      return citiesArr.length > 2 
                        ? `${citiesArr[0]}, ${citiesArr[1]} +${citiesArr.length - 2}`
                        : citiesArr.join(', ');
                    })()} • {ev.category}
                  </p>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AfishaCarousel;
