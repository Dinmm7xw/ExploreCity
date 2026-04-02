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
  const [city, setCity] = useState('All');

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
        <div className="search-card glass-card">
          <div className="search-input-area">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="city-divider">
            <i className="fas fa-map-marker-alt"></i>
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {["Astana", "Almaty", "Shymkent", "Karaganda", "Aktobe", "Taraz", "Pavlodar", "Oskemen", "Semey", "Atyrau", "Kyzylorda", "Kostanay", "Oral", "Petropavl", "Aktau", "Turkistan", "Kokshetau", "Taldykorgan", "Zhezkazgan"].sort().map(c => <option key={c} value={c}>{t(c)}</option>)}
              <option value="All">{t('all_cities')}</option>
            </select>
          </div>
          <button className="btn-primary search-button" onClick={handleSearch}>
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
                <h3>{t(c.name)}</h3>
                <p>{t('kazakhstan')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Карта Мероприятий Leaflet */}
      <MapView embedded={true} activeCity={city} />
    </>
  );
}

export default Home;
