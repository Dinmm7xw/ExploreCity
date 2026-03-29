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

function MapView({ embedded = false }) {
  const { t } = useTranslation();
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const mapRef = React.useRef(null);
  const mapInstance = React.useRef(null);

  React.useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/events`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const validEvents = data.filter(ev => ev.latitude && ev.longitude);
        setEvents(validEvents);
      }
    } catch (err) {
      console.error('Fetch Map Events Error:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!loading && mapRef.current && !mapInstance.current) { // Инициализация карты
      const map = L.map(mapRef.current);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const markers = []; // Для автоцентрирования

      events.forEach(ev => {
        const lat = parseFloat(ev.latitude);
        const lng = parseFloat(ev.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          let bannerUrl = ev.image_url || 'https://picsum.photos/200/100';
          if (bannerUrl.includes('youtube.com') || bannerUrl.includes('youtu.be')) {
            const vidId = bannerUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:v\/|u\/\w\/|embed\/|watch\?v=))([^#&?]*)/)?.[1];
            if (vidId) bannerUrl = `https://img.youtube.com/vi/${vidId}/0.jpg`;
          }

          const marker = L.marker([lat, lng]).addTo(map);
          markers.push([lat, lng]); // Добавляем координаты
          const popupContent = `
            <div style="min-width: 150px">
              <img src="${bannerUrl}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
              <h4 style="margin: 0 0 5px; font-size: 14px;">${ev.title}</h4>
              <p style="margin: 0 0 10px; font-size: 12px; color: #666;">${ev.date} | ${ev.city}</p>
              <a href="/event/${ev.id}" style="display: block; padding: 6px 0; text-align: center; background: #c17b4c; color: white; border-radius: 5px; text-decoration: none; font-size: 12px; font-weight: bold;">
                ${t('view_btn')}
              </a>
            </div>
          `;
          marker.bindPopup(popupContent);
        }
      });
      
      // Автоматическое масштабирование и центрирование карты (fitBounds)
      if (markers.length > 0) {
        const bounds = L.latLngBounds(markers);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else {
        // Дефолт (если нет событий с координатами)
        map.setView([48.0196, 66.9237], 5); // Центр Казахстана
      }

      mapInstance.current = map;
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [loading, events, t]);

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
