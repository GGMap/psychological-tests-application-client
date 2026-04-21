import React, { useState } from 'react';
import { API_URL } from '../config';
import '../css/components/ChangePasswordModal.css';
import {handleUnauthorized} from "../contexts/authUtils";

const ChangePasswordModal = ({ isOpen, onClose, userId, userName, currentAdminId, token, onSuccess }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Новые пароли не совпадают');
            return;
        }

        if (newPassword.length < 12) {
            setError('Новый пароль должен содержать минимум 12 символов');
            return;
        }

        setLoading(true);

        try {
            const targetAdminId = userId || currentAdminId;
            const body = {
                adminId: targetAdminId,
                oldPassword: oldPassword,
                newPassword: newPassword
            };
            console.log('Отправляем запрос на смену пароля:', body);
            const response = await fetch(`${API_URL}/admins/change-password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (handleUnauthorized(response)) return;

            if (response.status === 204) {
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                if (onSuccess) onSuccess();
                onClose();
                return;
            }

            let data = {};
            try {
                data = await response.json();
            } catch (err) {
                console.warn('Не удалось распарсить JSON ответа:', err);
            }

            if (!response.ok) {
                setError(data.message || `Ошибка ${response.status}`);
            }
        } catch (err) {
            console.error('Ошибка при смене пароля:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const EyeIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );

    const EyeOffIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );

    return (
        <div className="modal-overlay">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Смена пароля</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>

                    {userId && userName && (
                        <div className="modal-info">
                            Пользователь: <strong>{userName}</strong>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Старый пароль</label>
                        <div className="password-wrapper">
                            <input
                                type={showOldPassword ? 'text' : 'password'}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                            <button type="button" className="toggle-password" onClick={() => setShowOldPassword(!showOldPassword)}>
                                {showOldPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Новый пароль</label>
                        <div className="password-wrapper">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                            <button type="button" className="toggle-password" onClick={() => setShowNewPassword(!showNewPassword)}>
                                {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Подтверждение нового пароля</label>
                        <div className="password-wrapper">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                            <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>

                    <div className="modal-error-container">
                        {error && <div className="modal-error">{error}</div>}
                    </div>

                    <div className="modal-buttons">
                        <button type="submit" disabled={loading} className="submit-btn">
                            {loading ? 'Сохранение...' : 'Сменить пароль'}
                        </button>
                        <button type="button" onClick={onClose} className="cancel-btn">Отмена</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;