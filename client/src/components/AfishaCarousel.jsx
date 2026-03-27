import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function AfishaCarousel() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState([]);
  
  useEffect(() => {
    fetch(`${API_URL}/api/events`)
      .then(res => res.json())
      .then(data => {
        // Мы берем последние события (до 4 штук) и размножаем их, 
        // чтобы сделать крутую анимацию "бесконечной бегущей строки" (Marquee)
        const items = data.slice(0, 4);
        if (items.length > 0) {
           setFeatured([...items, ...items, ...items, ...items]); 
        }
      })
      .catch(e => console.error(e));
  }, []);

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
              <Link key={i + '-' + ev.id} to={`/event/${ev.id}`} className="featured-card-link" style={{ textDecoration: 'none', color: 'white', flex: '0 0 340px' }}>
                <div className="featured-card" style={{ 
                  height: '460px', 
                  borderRadius: '24px', 
                  overflow: 'hidden', 
                  position: 'relative',
                  backgroundImage: !ytId ? `url(${cardImg})` : 'none',
                  background: ytId ? '#000' : 'transparent',
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
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '40px 24px 30px', background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4) 60%, transparent)', zIndex: 2 }}>
                  <span style={{ background: 'var(--primary)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{ev.date || t('coming_soon')}</span>
                  <h3 style={{ fontSize: '26px', margin: '14px 0 8px', fontWeight: '800', color: 'white', lineHeight: '1.2' }}>{ev.title}</h3>
                  <p style={{ fontSize: '15px', color: '#ddd' }}><i className="fas fa-location-dot"></i> {ev.city} • {ev.category}</p>
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
