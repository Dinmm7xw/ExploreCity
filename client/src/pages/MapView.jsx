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

const CITY_COORDS = {
  "Astana": [51.1694, 71.4491],
  "Almaty": [43.2389, 76.8897],
  "Shymkent": [42.3155, 69.5869],
  "Karaganda": [49.8019, 73.1021],
  "Aktobe": [50.2839, 57.1670],
  "Taraz": [42.9000, 71.3667],
  "Pavlodar": [52.3156, 76.9564],
  "Oskemen": [49.9483, 82.6279],
  "Semey": [50.4114, 80.2275],
  "Atyrau": [47.1167, 51.8833],
  "Kyzylorda": [44.8486, 65.4822],
  "Kostanay": [53.2198, 63.6283],
  "Oral": [51.2333, 51.3667],
  "Petropavl": [54.8753, 69.1628],
  "Aktau": [43.6481, 51.1610],
  "Turkistan": [43.2973, 68.2518],
  "Kokshetau": [53.2824, 69.3969],
  "Taldykorgan": [45.0156, 78.3739],
  "Zhezkazgan": [47.7833, 67.7667]
};

function MapView({ embedded = false, activeCity = 'All' }) {
  const { t } = useTranslation();
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [userLocation, setUserLocation] = React.useState(null);
  const mapRef = React.useRef(null);
  const mapInstance = React.useRef(null);

  React.useEffect(() => {
    fetchEvents(activeCity);
  }, [activeCity]);

  const handleGeoLocation = () => {
    if (userLocation) {
      setUserLocation(null);
      return;
    }
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          // Если пользователь нажал "Запретить" доступ к геолокации
          alert('Не удалось получить гео-позицию. Разрешите доступ к локации в настройках браузера.');
        }
      );
    } else {
      alert('Ваш браузер не поддерживает GPS (Гео-позицию)');
    }
  };

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
      const userLatLng = userLocation ? L.latLng(userLocation.lat, userLocation.lng) : null;

      // 1. Рисуем 5-километровый прозрачный зеленый/синий круг вокруг пользователя (радар)
      if (userLatLng) {
        L.circle(userLatLng, { radius: 5000, color: '#3498db', fillOpacity: 0.1, weight: 2 }).addTo(map);
        L.circleMarker(userLatLng, { radius: 8, color: 'white', fillColor: '#3498db', fillOpacity: 1, weight: 3 }).addTo(map).bindPopup('<b>Вы здесь</b>');
      }

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
            const locLatLng = L.latLng(loc.lat, loc.lng);
            
            // Если включен режим Гео-радара, скрываем маркеры дальше 5 км
            if (userLatLng) {
              const distance = userLatLng.distanceTo(locLatLng);
              if (distance > 5000) return; 
            }

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
      
      // Логика центрирования карты
      if (userLatLng) {
         // Отдаем приоритет центрированию на пользователя
         map.setView(userLatLng, 12);
      } else if (markers.length > 0) {
        const bounds = L.latLngBounds(markers);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else {
        if (activeCity !== 'All' && CITY_COORDS[activeCity]) {
          map.setView(CITY_COORDS[activeCity], 12);
        } else {
          map.setView([48.0196, 66.9237], 5);
        }
      }

      mapInstance.current = map;
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [loading, events, activeCity, t, userLocation]);

  const mapContent = (
      <div className="glass-card mobile-h-400" style={{ position: 'relative', padding: '10px', height: embedded ? '500px' : '600px', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
        
        {/* Кнопка активации GPS-Радара */}
        <button 
          onClick={handleGeoLocation}
          className="mobile-geo-btn"
          style={{
            position: 'absolute', top: '20px', right: '20px', zIndex: 1000,
            padding: '10px 20px', background: userLocation ? '#e74c3c' : 'white',
            color: userLocation ? 'white' : 'var(--primary)', 
            borderRadius: '30px', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)', fontWeight: 'bold', 
            display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s'
          }}
        >
          {userLocation ? (
            <><i className="fas fa-times"></i> Сбросить радар</>
          ) : (
            <><i className="fas fa-location-crosshairs"></i> {t('near_me') || 'Рядом (5 км)'}</>
          )}
        </button>

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
