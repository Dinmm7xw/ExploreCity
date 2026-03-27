import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';

function Register({ setAuth }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Ошибка регистрации');
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setAuth(true);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box glass-card">
        <h2 className="auth-title">{t('register')}</h2>
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ваше Имя (ФИО)" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <input 
              type="email" 
              className="input-field" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <input 
              type="password" 
              className="input-field" 
              placeholder="Пароль" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" style={{width: '100%', justifyContent: 'center'}} disabled={loading}>
            {loading ? <div className="spinner"></div> : t('register')}
          </button>
        </form>
        <p style={{textAlign: 'center', marginTop: '20px', fontSize: '14px'}}>
          Уже есть аккаунт? <Link to="/login" style={{color: 'var(--primary)', fontWeight: 'bold'}}>Войдите</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
