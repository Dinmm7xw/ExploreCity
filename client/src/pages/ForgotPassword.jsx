import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';

function ForgotPassword() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [testUrl, setTestUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setTestUrl('');
        setError('');

        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(t('forgot_pass_success') || data.message);
                if (data.testUrl) setTestUrl(data.testUrl);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError(t('server_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '100px 20px', maxWidth: '500px' }}>
            <div className="glass-card" style={{ padding: '40px' }}>
                <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>{t('forgot_password_title')}</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px', textAlign: 'center' }}>
                    {t('forgot_password_desc')}
                </p>

                {message && (
                    <div style={{ color: '#2ecc71', marginBottom: '20px', textAlign: 'center', background: 'rgba(46, 204, 113, 0.1)', padding: '15px', borderRadius: '10px' }}>
                        <div>{message}</div>
                    </div>
                )}

                {testUrl && (
                    <div style={{ marginBottom: '20px', textAlign: 'center', background: 'rgba(193, 123, 76, 0.1)', padding: '15px', borderRadius: '10px' }}>
                        <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-muted)' }}>В демо-режиме (без почты) используйте ссылку ниже:</p>
                        <a href={testUrl} style={{ color: 'var(--primary)', fontWeight: 'bold', wordBreak: 'break-all' }}>Перейти к сбросу пароля</a>
                    </div>
                )}
                {error && <div style={{ color: '#e74c3c', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label>{t('email_label')}</label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="example@mail.ru"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? t('sending') : t('send_reset_link')}
                    </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                        ← {t('back_to_login')}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
