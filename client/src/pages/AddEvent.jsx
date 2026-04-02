import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';

const LOCATION_COORDS = {
  "Астана Арена (Туран 48)": { lat: 51.1082, lng: 71.4024, city: "Astana" },
  "Дворец Республики (Достык 56)": { lat: 43.2435, lng: 76.9572, city: "Almaty" },
  "Barys Arena (Туран 57)": { lat: 51.1044, lng: 71.4069, city: "Astana" },
  "Astana Opera (Кунаева 1)": { lat: 51.1257, lng: 71.4116, city: "Astana" },
  "Центральный стадион (Абая 48)": { lat: 43.2383, lng: 76.9234, city: "Almaty" }
};

function AddEvent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    city: 'Astana',
    location: 'Астана Арена (Туран 48)',
    date: '',
    time: '',
    description: '',
    image_url: '',
    latitude: 51.1082,
    longitude: 71.4024,
    coordinatesStr: '51.1082, 71.4024',
    price: 5000,
    sessions: []
  });

  const handleAddSession = () => {
    setFormData({
      ...formData,
      sessions: [...(formData.sessions || []), { city: formData.city, location: '', date: '', time: '', coordinatesStr: '', latitude: null, longitude: null }]
    });
  };

  const handleRemoveSession = (index) => {
    const newSessions = [...formData.sessions];
    newSessions.splice(index, 1);
    setFormData({ ...formData, sessions: newSessions });
  };

  const handleSessionChange = (index, field, value) => {
    const newSessions = [...formData.sessions];
    
    if (field === 'coordinatesStr') {
      newSessions[index].coordinatesStr = value;
      const parts = value.split(',').map(p => p.trim());
      let lat = null, lng = null;
      if (parts.length >= 2 && parts[0] !== '' && parts[1] !== '') {
        lat = parseFloat(parts[0]);
        lng = parseFloat(parts[1]);
      }
      newSessions[index].latitude = isNaN(lat) ? null : lat;
      newSessions[index].longitude = isNaN(lng) ? null : lng;
    } else if (field === 'location' && LOCATION_COORDS[value]) {
       // Auto-fill from constants if they type known place
      newSessions[index].location = value;
      newSessions[index].latitude = LOCATION_COORDS[value].lat;
      newSessions[index].longitude = LOCATION_COORDS[value].lng;
      newSessions[index].city = LOCATION_COORDS[value].city;
      newSessions[index].coordinatesStr = `${LOCATION_COORDS[value].lat}, ${LOCATION_COORDS[value].lng}`;
    } else {
      newSessions[index][field] = value;
    }
    
    setFormData({ ...formData, sessions: newSessions });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'location') {
      if (LOCATION_COORDS[value]) {
        setFormData({
          ...formData, 
          location: value, 
          latitude: LOCATION_COORDS[value].lat, 
          longitude: LOCATION_COORDS[value].lng,
          city: LOCATION_COORDS[value].city,
          coordinatesStr: `${LOCATION_COORDS[value].lat}, ${LOCATION_COORDS[value].lng}`
        });
      } else {
        setFormData({...formData, location: value, latitude: '', longitude: '', coordinatesStr: ''});
      }
    } else if (name === 'coordinatesStr') {
      const parts = value.split(',').map(p => p.trim());
      let lat = '', lng = '';
      if (parts.length >= 2 && parts[0] !== '' && parts[1] !== '') {
        lat = parseFloat(parts[0]);
        lng = parseFloat(parts[1]);
      }
      setFormData({...formData, coordinatesStr: value, latitude: isNaN(lat) ? '' : lat, longitude: isNaN(lng) ? '' : lng});
    } else if (name === 'price') {
      setFormData({...formData, [name]: parseInt(value) || 0});
    } else {
      setFormData({...formData, [name]: value});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Client-side validation
    if (!formData.title || !formData.category || !formData.city || !formData.location) {
      setError(t('fill_required'));
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert(t('Мероприятие создано'));
        navigate('/admin');
      } else {
        setError(t(data.message) || data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
      <div className="glass-card" style={{ padding: '40px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '32px', textAlign: 'center' }}>{t('add_event')}</h2>
        
        {error && <div className="error-msg" style={{marginBottom: '20px', background: 'rgba(231, 76, 60, 0.1)', padding:'10px', borderRadius:'10px'}}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
          <div>
            <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>{t('title_label')}</label>
            <input type="text" name="title" className="input-field" value={formData.title} onChange={handleChange} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>{t('category_label')}</label>
              <input type="text" name="category" className="input-field" placeholder={t('category_placeholder')} value={formData.category} onChange={handleChange} />
            </div>
            <div>
              <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>{t('city_label')}</label>
              <select name="city" className="input-field" value={formData.city} onChange={handleChange}>
                {["Astana", "Almaty", "Shymkent", "Karaganda", "Aktobe", "Taraz", "Pavlodar", "Oskemen", "Semey", "Atyrau", "Kyzylorda", "Kostanay", "Oral", "Petropavl", "Aktau", "Turkistan", "Kokshetau", "Taldykorgan", "Zhezkazgan"].sort().map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
             <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>{t('location_label')}</label>
             <input type="text" list="popular-locations" name="location" className="input-field" value={formData.location} onChange={handleChange} placeholder={t('location_placeholder')} />
             <datalist id="popular-locations">
                {Object.keys(LOCATION_COORDS)
                  .filter(loc => !formData.city || LOCATION_COORDS[loc].city === formData.city)
                  .map(loc => <option key={loc} value={loc} />)
                }
             </datalist>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>{t('date_label')}</label>
              <input type="date" name="date" className="input-field" value={formData.date} onChange={handleChange} />
            </div>
            <div>
              <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>{t('time_label')}</label>
              <input type="time" name="time" className="input-field" value={formData.time} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>{t('price_label')}</label>
            <input type="number" name="price" className="input-field" value={formData.price} onChange={handleChange} placeholder={t('price_placeholder')} />
          </div>

          <div>
             <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>{t('image_url_label')}</label>
             <input type="text" name="image_url" className="input-field" value={formData.image_url || ''} onChange={handleChange} placeholder={t('image_url_placeholder')} />
             
             {/* Живое превью новой картинки */}
             {formData.image_url && (
                <div style={{ marginTop: '15px', borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--primary)' }}>
                    <img 
                      src={(() => {
                        if (!formData.image_url) return '';
                        if (formData.image_url.includes('youtube.com') || formData.image_url.includes('youtu.be')) {
                          const vidId = formData.image_url.match(/(?:youtu\.be\/|youtube\.com\/(?:v\/|u\/\w\/|embed\/|watch\?v=))([^#&?]*)/)?.[1];
                          return vidId ? `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg` : '';
                        }
                        return formData.image_url;
                      })()} 
                      alt="Preview" 
                      style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} 
                    />
                </div>
             )}
          </div>

          <div>
            <label style={{display:'block', marginBottom:'4px', fontWeight:'600'}}>{t('coordinates_label')} <span style={{fontSize:'12px', color:'#888', fontWeight:'normal'}}>{t('coordinates_hint')}</span></label>
            <input type="text" name="coordinatesStr" className="input-field" value={formData.coordinatesStr} onChange={handleChange} placeholder={t('coordinates_example')} />
          </div>

          {/* SESSIONS BLOCK */}
          <div style={{ marginTop: '10px', padding: '20px', background: 'rgba(0,0,0,0.02)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{t('sessions_schedule')} {t('optional_label')}</h3>
              <button type="button" onClick={handleAddSession} style={{ padding: '6px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>{t('add_session')}</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '-8px', marginBottom: '20px' }}>{t('sessions_desc')}</p>

            {formData.sessions && formData.sessions.map((session, idx) => (
              <div key={idx} style={{ padding: '16px', background: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '15px', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <button type="button" onClick={() => handleRemoveSession(idx)} style={{ position: 'absolute', top: '10px', right: '10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>&times;</button>
                <div style={{ fontWeight: 'bold', marginBottom: '15px', color: 'var(--primary)' }}>{t('session_number')} #{idx + 1}</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                  <div>
                    <label style={{display:'block', fontSize:'13px', marginBottom:'4px', fontWeight: 'bold'}}>{t('date_label')}</label>
                    <input type="date" className="input-field" value={session.date} onChange={(e) => handleSessionChange(idx, 'date', e.target.value)} style={{ padding: '10px' }} />
                  </div>
                  <div>
                    <label style={{display:'block', fontSize:'13px', marginBottom:'4px', fontWeight: 'bold'}}>{t('time_label')}</label>
                    <input type="time" className="input-field" value={session.time} onChange={(e) => handleSessionChange(idx, 'time', e.target.value)} style={{ padding: '10px' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', marginBottom: '12px' }}>
                  <div>
                    <label style={{display:'block', fontSize:'13px', marginBottom:'4px', fontWeight: 'bold'}}>{t('city_label')}</label>
                    <select className="input-field" value={session.city} onChange={(e) => handleSessionChange(idx, 'city', e.target.value)} style={{ padding: '10px' }}>
                       {["Astana", "Almaty", "Shymkent", "Karaganda", "Aktobe", "Taraz", "Pavlodar", "Oskemen", "Semey", "Atyrau", "Kyzylorda", "Kostanay", "Oral", "Petropavl", "Aktau", "Turkistan", "Kokshetau", "Taldykorgan", "Zhezkazgan"].sort().map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block', fontSize:'13px', marginBottom:'4px', fontWeight: 'bold'}}>{t('location_label')}</label>
                    <input type="text" list="popular-locations" className="input-field" value={session.location} onChange={(e) => handleSessionChange(idx, 'location', e.target.value)} placeholder={t('location_example')} style={{ padding: '10px' }} />
                  </div>
                </div>

                <div>
                  <label style={{display:'block', fontSize:'13px', marginBottom:'4px', fontWeight: 'bold'}}>{t('coordinates_label')} ({t('coordinates_short')})</label>
                  <input type="text" className="input-field" value={session.coordinatesStr || ''} onChange={(e) => handleSessionChange(idx, 'coordinatesStr', e.target.value)} placeholder="51.123, 71.456" style={{ padding: '10px' }} />
                </div>
              </div>
            ))}
          </div>
          {/* END SESSIONS BLOCK */}

          <div>
             <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>{t('rating_label')}</label>
             <input type="number" name="rating" className="input-field" min="0" max="5" step="0.1" value={formData.rating || 5.0} onChange={handleChange} />
          </div>

          <div>
             <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>{t('description_label')}</label>
             <textarea name="description" className="input-field" style={{resize: 'vertical', minHeight: '120px'}} value={formData.description} onChange={handleChange}></textarea>
          </div>

          <button type="submit" className="btn-primary" style={{justifyContent: 'center', fontSize: '18px', padding: '16px'}} disabled={loading}>
            {loading ? <div className="spinner"></div> : t('publish_btn')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddEvent;
