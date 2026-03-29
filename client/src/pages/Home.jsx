import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AfishaCarousel from '../components/AfishaCarousel';
import MapView from './MapView';
import './Home.css';

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [city, setCity] = useState('Almaty');

  const popularCities = [
    { name: "Almaty", icon: "fa-city" },
    { name: "Astana", icon: "fa-building" },
    { name: "Shymkent", icon: "fa-tree" },
    { name: "Karaganda", icon: "fa-industry" },
    { name: "Aktau", icon: "fa-water" },
    { name: "Atyrau", icon: "fa-ship" }
  ];

  const handleSearch = () => {
    navigate(`/events?city=${city}&search=${searchTerm}`);
  };

  return (
    <>
      {/* 1. Слайдер с билетами в самом верху */}
      <AfishaCarousel />

      {/* 2. Поиск */}
      <div className="container" style={{ marginTop: '20px', marginBottom: '60px' }}>
        <div className="glass-card" style={{ display: 'flex', gap: '20px', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '20px', boxShadow: '0 15px 40px rgba(0,0,0,0.06)' }}>
          <div style={{ flex: 2, display: 'flex', alignItems: 'center', padding: '10px 20px', background: '#f8f9fa', borderRadius: '16px' }}>
            <i className="fas fa-search" style={{ color: 'var(--text-muted)', fontSize: '20px', marginRight: '15px' }}></i>
            <input 
              type="text" 
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '16px', fontWeight: '600' }}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '10px 20px', background: '#f8f9fa', borderRadius: '16px' }}>
            <i className="fas fa-map-marker-alt" style={{ color: 'var(--primary)', fontSize: '20px', marginRight: '15px' }}></i>
            <select value={city} onChange={(e) => setCity(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              {["Astana", "Almaty", "Shymkent", "Karaganda", "Aktobe", "Taraz", "Pavlodar", "Oskemen", "Semey", "Atyrau", "Kyzylorda", "Kostanay", "Oral", "Petropavl", "Aktau", "Turkistan", "Kokshetau", "Taldykorgan", "Zhezkazgan"].sort().map(c => <option key={c} value={c}>{c}</option>)}
              <option value="All">{t('all_cities')}</option>
            </select>
          </div>
          <button className="btn-primary" onClick={handleSearch} style={{ padding: '20px 40px', fontSize: '18px', borderRadius: '16px', height: '100%' }}>
            {t('search_btn')}
          </button>
        </div>
      </div>

      {/* 3. Города */}
      <div className="cities-section">
        <div className="container">
          <div className="section-title">
            <h2>{t('popular_cities')}</h2>
            <div className="title-underline"></div>
          </div>
          <div className="cities-grid">
            {popularCities.map((c, idx) => (
              <div 
                key={c.name} 
                className="city-block glass-card" 
                onClick={() => {setCity(c.name); navigate(`/events?city=${c.name}`);}}
                style={{animationDelay: `${idx * 0.1}s`}}
              >
                <div className="city-icon">
                  <i className={`fas ${c.icon}`}></i>
                </div>
                <h3>{c.name}</h3>
                <p>Kazakhstan</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Карта Мероприятий Leaflet */}
      <MapView embedded={true} />
    </>
  );
}

export default Home;
