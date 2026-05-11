import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { adminService } from '../services/adminService';
import '../css/components/EditProfileModal.css';

const EditProfileModal = ({ isOpen, onClose, userId, currentAdminId, token, onSuccess }) => {
    const targetId = userId || currentAdminId;

    // Данные профиля
    const [sname, setSname] = useState('');
    const [fname, setFname] = useState('');
    const [mname, setMname] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    // Пароль
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changePassword, setChangePassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isOpen && targetId) {
            const fetchData = async () => {
                try {
                    setLoading(true);
                    const admin = await adminService.getAdminById(targetId, token);
                    setSname(admin.sname || '');
                    setFname(admin.fname || '');
                    setMname(admin.mname || '');
                    setPhoneNumber(admin.phoneNumber || '');
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setChangePassword(false);
            setError('');
        }
    }, [isOpen, targetId, token]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await adminService.updateAdminProfile(targetId, { sname, fname, mname, phoneNumber }, token);

            if (changePassword && newPassword) {
                if (newPassword !== confirmPassword) {
                    throw new Error('Новые пароли не совпадают');
                }
                if (newPassword.length < 6) {
                    throw new Error('Новый пароль должен содержать минимум 6 символов');
                }
                const response = await fetch(`${API_URL}/admins/change-password`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        adminId: targetId,
                        oldPassword,
                        newPassword,
                    }),
                });
                if (response.status === 204) {
                    // success
                } else if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Ошибка смены пароля');
                }
            }

            alert('Профиль успешно обновлён');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
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
            <div className="modal-content edit-profile-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Редактирование профиля</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    {error && <div className="modal-error">{error}</div>}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Фамилия</label>
                            <input type="text" value={sname} onChange={(e) => setSname(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Имя</label>
                            <input type="text" value={fname} onChange={(e) => setFname(e.target.value)} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Отчество</label>
                        <input type="text" value={mname} onChange={(e) => setMname(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Телефон</label>
                        <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                    </div>


                        <div className="form-group checkbox-group">
                        <label>
                            Сменить пароль
                            <input type="checkbox" checked={changePassword} onChange={(e) => setChangePassword(e.target.checked)} />
                        </label>
                        </div>
                    {changePassword && (
                        <>
                            <div className="form-group">
                                <label>Старый пароль</label>
                                <div className="password-wrapper">
                                <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required={changePassword} />
                                <button type="button" className="toggle-password-modal" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Новый пароль</label>
                                <div className="password-wrapper">
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required={changePassword} />
                                <button type="button" className="toggle-password-modal" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Подтверждение пароля</label>
                                <div className="password-wrapper">
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required={changePassword} />
                                <button type="button" className="toggle-password-modal" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="modal-buttons">
                        <button type="button" onClick={onClose} className="cancel-btn">Отмена</button>
                        <button type="submit" disabled={loading} className="submit-btn">
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;