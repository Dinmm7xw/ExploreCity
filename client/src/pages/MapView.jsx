import React from 'react';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapView({ embedded = false, activeCity = 'All' }) {
  const { t } = useTranslation();
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const mapRef = React.useRef(null);
  const mapInstance = React.useRef(null);

  React.useEffect(() => {
    fetchEvents(activeCity);
  }, [activeCity]);

  const fetchEvents = async (cityName) => {
    try {
      setLoading(true);
      const url = cityName && cityName !== 'All' 
        ? `${API_URL}/api/events?city=${cityName}` 
        : `${API_URL}/api/events`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setEvents(data);
      }
    } catch (err) {
      console.error('Fetch Map Events Error:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    // Чистим старую карту, чтобы нарисовать маркеры нового города
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
      if (mapRef.current) mapRef.current.innerHTML = '';
    }

    if (!loading && mapRef.current) {
      const map = L.map(mapRef.current);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const markers = [];

      events.forEach(ev => {
        let bannerUrl = ev.image_url || 'https://picsum.photos/200/100';
        if (bannerUrl.includes('youtube.com') || bannerUrl.includes('youtu.be')) {
          const vidId = bannerUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:v\/|u\/\w\/|embed\/|watch\?v=))([^#&?]*)/)?.[1];
          if (vidId) bannerUrl = `https://img.youtube.com/vi/${vidId}/0.jpg`;
        }

        const locationsToPlot = [];
        
        // Добавляем Мастер Событие
        if (ev.latitude && ev.longitude) {
          if (activeCity === 'All' || ev.city === activeCity) {
            locationsToPlot.push({ lat: parseFloat(ev.latitude), lng: parseFloat(ev.longitude), date: ev.date, city: ev.city, title: ev.title });
          }
        }
        
        // Добавляем все вложенные сеансы
        if (ev.sessions && Array.isArray(ev.sessions)) {
          ev.sessions.forEach(s => {
            if (s.latitude && s.longitude) {
              if (activeCity === 'All' || s.city === activeCity) {
                locationsToPlot.push({ lat: parseFloat(s.latitude), lng: parseFloat(s.longitude), date: s.date, city: s.city, title: `${ev.title} (${s.location})` });
              }
            }
          });
        }

        locationsToPlot.forEach(loc => {
          if (!isNaN(loc.lat) && !isNaN(loc.lng)) {
            const marker = L.marker([loc.lat, loc.lng]).addTo(map);
            markers.push([loc.lat, loc.lng]); 
            const popupContent = `
              <div style="min-width: 150px">
                <img src="${bannerUrl}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
                <h4 style="margin: 0 0 5px; font-size: 14px;">${loc.title}</h4>
                <p style="margin: 0 0 10px; font-size: 12px; color: #666;">${loc.date || ''} | ${loc.city}</p>
                <a href="/event/${ev.id}" style="display: block; padding: 6px 0; text-align: center; background: #c17b4c; color: white; border-radius: 5px; text-decoration: none; font-size: 12px; font-weight: bold;">
                  ${t('view_btn')}
                </a>
              </div>
            `;
            marker.bindPopup(popupContent);
          }
        });
      });
      
      if (markers.length > 0) {
        const bounds = L.latLngBounds(markers);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else {
        map.setView([48.0196, 66.9237], 5);
      }

      mapInstance.current = map;
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [loading, events, activeCity, t]);

  const mapContent = (
      <div className="glass-card" style={{ padding: '10px', height: embedded ? '500px' : '600px', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div ref={mapRef} style={{ height: '100%', width: '100%', borderRadius: '15px', zIndex: 1 }}></div>
        )}
      </div>
  );

  if (embedded) {
    return (
      <div style={{ padding: '60px 0', background: 'rgba(0,0,0,0.02)' }}>
        <div className="container">
          <div className="section-title">
            <h2>{t('event_map') || 'Все мероприятия на карте'}</h2>
            <div className="title-underline"></div>
          </div>
          {mapContent}
          <div style={{ marginTop: '20px', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
            <i className="fas fa-info-circle"></i> {t('map_hint') || 'Нажмите на маркер, чтобы увидеть детали мероприятия'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px', minHeight: '80vh' }}>
      <div className="section-title">
        <h2>{t('map_view_title') || 'Карта мероприятий'}</h2>
        <div className="title-underline"></div>
      </div>

      {mapContent}
      
      <div style={{ marginTop: '20px', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
        <i className="fas fa-info-circle"></i> {t('map_hint') || 'Нажмите на маркер, чтобы увидеть детали мероприятия'}
      </div>
    </div>
  );
}

export default MapView;
