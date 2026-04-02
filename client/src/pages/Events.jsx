import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';
import './Events.css';

function Events() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const cityQuery = searchParams.get('city') || 'All';
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    fetchEvents();
  }, [cityQuery]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const url = cityQuery !== 'All' 
        ? `${API_URL}/api/events?city=${cityQuery}`
        : `${API_URL}/api/events`;
        
      const res = await fetch(url);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || t('loading_error') || 'Ошибка загрузки');
      
      let filtered = data;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = data.filter(e => 
          e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
        );
      }
      
      setEvents(filtered);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px', minHeight: '80vh' }}>
      <div className="section-title">
        <h2>{t('events')} {cityQuery !== 'All' ? `- ${cityQuery}` : ''}</h2>
        <div className="title-underline"></div>
      </div>

      {loading ? (
        <div style={{display: 'flex', justifyContent: 'center', marginTop: '50px'}}>
          <div className="spinner" style={{borderColor: 'var(--primary)', borderTopColor: 'transparent', width: '40px', height: '40px'}}></div>
          <p style={{marginLeft: '15px', color: 'var(--primary)', fontWeight: '600'}}>{t('loading')}</p>
        </div>
      ) : error ? (
        <div className="error-msg">{error}</div>
      ) : events.length === 0 ? (
        <div style={{textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)'}}>
          <i className="fas fa-box-open" style={{fontSize: '48px', marginBottom: '16px', opacity: 0.5}}></i>
          <h3>{t('no_events_found') || 'По вашему запросу ничего не найдено'}</h3>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((ev, index) => {
            const getYouTubeId = (url) => {
              if (!url) return null;
              const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
              const match = url.match(regExp);
              return (match && match[2].length === 11) ? match[2] : null;
            };

            const ytId = getYouTubeId(ev.image_url);
            const cardImg = ytId 
              ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` 
              : (ev.image_url || `https://picsum.photos/400/250?random=${ev.id}`);

            return (
              <div key={ev.id} className="event-card glass-card" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="event-img-wrapper" style={{ position: 'relative', height: '220px', overflow: 'hidden', background: '#000' }}>
                    {ytId ? (
                      <div className="event-video-always" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                        <iframe 
                          width="100%" 
                          height="100%" 
                          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&modestbranding=1&rel=0`} 
                          title="YouTube video player" 
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          style={{ pointerEvents: 'none', transform: 'scale(1.5)' }}
                        ></iframe>
                      </div>
                    ) : (
                      <div 
                        className="event-img" 
                        style={{ 
                          backgroundImage: `url(${cardImg})`, 
                          height: '100%', 
                          backgroundSize: 'cover', 
                          backgroundPosition: 'center'
                        }}
                      >
                      </div>
                    )}
                    <div className="rating-badge" style={{ zIndex: 3 }}><i className="fas fa-star"></i> {ev.rating}</div>
                </div>
                <div className="event-info">
                  <h3>{ev.title}</h3>
                  <div className="event-meta">
                    <span><i className="fas fa-tag"></i> {ev.category}</span>
                    <span>
                      <i className="fas fa-location-dot"></i> {(() => {
                        const cities = new Set([ev.city]);
                        if (ev.sessions) ev.sessions.forEach(s => cities.add(s.city));
                        const citiesArr = Array.from(cities);
                        return citiesArr.length > 2 
                          ? `${citiesArr[0]}, ${citiesArr[1]} +${citiesArr.length - 2}`
                          : citiesArr.join(', ');
                      })()}
                    </span>
                  </div>
                  {ev.date && (
                    <div className="event-datetime">
                      <span><i className="far fa-calendar-alt"></i> {ev.date}</span>
                      <span><i className="far fa-clock"></i> {ev.time}</span>
                    </div>
                  )}
                  <div style={{marginTop: 'auto'}}>
                    <Link to={`/event/${ev.id}`} className="detail-link">
                      {t('more_btn') || 'Толығырақ'} <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Events;
