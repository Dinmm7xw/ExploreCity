import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';

function ResetPassword() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError(t('passwords_dont_match'));
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(t('reset_pass_success') || data.message);
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError(t('server_error'));
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
                <h2 style={{ color: '#e74c3c' }}>{t('invalid_token')}</h2>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '100px 20px', maxWidth: '500px' }}>
            <div className="glass-card" style={{ padding: '40px' }}>
                <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>{t('reset_password_title')}</h2>

                {message && <div style={{ color: '#2ecc71', marginBottom: '20px', textAlign: 'center' }}>{message}</div>}
                {error && <div style={{ color: '#e74c3c', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label>{t('new_password_label')}</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label>{t('confirm_password_label')}</label>
                        <input
                            type="password"
                            className="form-control"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? t('saving') : t('reset_password_btn')}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
