import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';
import { generateEventBanner, STYLE_PRESETS } from '../utils/aiService';

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
    ai_style: 'photorealistic',
    latitude: 51.1082,
    longitude: 71.4024
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'location') {
      if (LOCATION_COORDS[value]) {
        setFormData({
          ...formData, 
          location: value, 
          latitude: LOCATION_COORDS[value].lat, 
          longitude: LOCATION_COORDS[value].lng,
          city: LOCATION_COORDS[value].city
        });
      } else {
        setFormData({...formData, location: value, latitude: '', longitude: ''});
      }
    } else {
      setFormData({...formData, [name]: value});
    }
  };

  const handleMagicAI = async () => {
    if (!formData.title) {
        alert(t('enter_title_first') || 'Сначала введите название мероприятия для ИИ!');
        return;
    }
    
    setIsGeneratingAI(true);
    
    try {
        const styleKey = formData.ai_style || 'photorealistic';
        const blobUrl = await generateEventBanner(formData.title, formData.category, styleKey);
        setFormData(prev => ({...prev, image_url: blobUrl}));
    } catch (err) {
        console.error('AI Generation Error:', err);
        alert(t('ai_error') || 'ИИ сейчас перегружен или возникла ошибка. Попробуйте еще раз через минуту.');
    } finally {
        setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Client-side validation
    if (!formData.title || !formData.category || !formData.city || !formData.location) {
      setError(t('fill_required') || 'Заполните все обязательные поля (*)');
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
      
      if (!res.ok) throw new Error(data.message);
      
      alert(t('success_saved'));
      navigate(`/event/${data.id}`);
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
              <input type="text" name="category" className="input-field" placeholder={t('category_placeholder') || "Например: Выставка, Концерт"} value={formData.category} onChange={handleChange} />
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
             <input type="text" list="popular-locations" name="location" className="input-field" value={formData.location} onChange={handleChange} placeholder="Впишите точный адрес или выберите из списка..." />
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
             <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>{t('ai_style_label')}</label>
             <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <select 
                    name="ai_style" 
                    className="input-field" 
                    style={{ width: 'auto', flex: 1, minWidth: '150px' }}
                    value={formData.ai_style || 'photorealistic'}
                    onChange={handleChange}
                >
                    {Object.keys(STYLE_PRESETS).map(key => (
                        <option key={key} value={key}>{STYLE_PRESETS[key].label}</option>
                    ))}
                </select>

                <button 
                    type="button" 
                    onClick={handleMagicAI}
                    disabled={isGeneratingAI}
                    style={{ 
                        whiteSpace: 'nowrap', 
                        background: isGeneratingAI ? '#bdc3c7' : 'linear-gradient(135deg, #6e8efb, #a777e3)', 
                        color: 'white', 
                        border: 'none', 
                        padding: '0 25px', 
                        borderRadius: '14px', 
                        cursor: isGeneratingAI ? 'not-allowed' : 'pointer', 
                        fontWeight: 'bold',
                        fontSize: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 6px 20px rgba(110, 142, 251, 0.4)',
                        transition: 'all 0.3s ease',
                        flex: 1
                    }}
                >
                    {isGeneratingAI ? (
                         <><i className="fas fa-spinner fa-spin"></i> {t('drawing') || 'Рисуем...'}</>
                    ) : (
                         <><i className="fas fa-magic"></i> {t('magic_ai_btn')}</>
                    )}
                </button>
             </div>
             
             <div>
                <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>{t('image_url_label') || 'URL изображения'}</label>
                <input type="text" name="image_url" className="input-field" value={formData.image_url} onChange={handleChange} placeholder={t('image_url_placeholder') || "Ссылка на изображение или видео YouTube"} />
             </div>

             {/* Живое превью новой картинки */}
             {formData.image_url && (
                <div style={{ marginTop: '20px', borderRadius: '16px', overflow: 'hidden', border: isGeneratingAI ? '2px dashed var(--primary)' : '2px solid var(--primary)', position: 'relative', opacity: isGeneratingAI ? 0.6 : 1, transition: 'all 0.3s ease' }}>
                    <img 
                      src={(() => {
                        if (!formData.image_url) return '';
                        if (formData.image_url.includes('youtube.com') || formData.image_url.includes('youtu.be')) {
                          const vidId = formData.image_url.match(/(?:youtu\.be\/|youtube\.com\/(?:v\/|u\/\w\/|embed\/|watch\?v=))([^#&?]*)/)?.[1];
                          return vidId ? `https://img.youtube.com/vi/${vidId}/0.jpg` : formData.image_url;
                        }
                        return formData.image_url;
                      })()} 
                      alt="Превью" 
                      style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} 
                      key={formData.image_url} 
                    />
                    <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>
                            {isGeneratingAI ? t('ai_drawing') || '🎨 Нейросеть рисует...' : t('ai_subtitle') || '✨ ИИ создает уникальный баннер...'}
                        </span>
                        {!isGeneratingAI && (
                            <a href={formData.image_url} target="_blank" rel="noreferrer" style={{ color: 'white', fontSize: '10px', textDecoration: 'none', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '10px' }}>
                                <i className="fas fa-external-link-alt"></i> {t('open_original') || 'Открыть оригинал'}
                            </a>
                        )}
                    </div>
                </div>
             )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>{t('latitude_label') || 'Latitude'}</label>
              <input type="number" name="latitude" className="input-field" step="0.000001" value={formData.latitude} onChange={handleChange} />
            </div>
            <div>
              <label style={{display:'block', marginBottom:'8px', fontWeight:'600'}}>{t('longitude_label') || 'Longitude'}</label>
              <input type="number" name="longitude" className="input-field" step="0.000001" value={formData.longitude} onChange={handleChange} />
            </div>
          </div>

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
