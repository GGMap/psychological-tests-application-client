import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import { handleUnauthorized } from '../contexts/authUtils';
import '../css/pages/AdminSignUp.css';
import toast from "react-hot-toast";

const AdminSignUp = () => {
    const [surname, setSurname] = useState('');
    const [fullName, setFullName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { token } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/sign-up`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    sname: surname,
                    fname: fullName,
                    mname: middleName,
                    email: email,
                    password: password,
                    phoneNumber: phoneNumber,
                }),
            });

            if (handleUnauthorized(response)) return;

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Произошла ошибка регистрации!');
                return;
            }

            toast.success('Регистрация прошла успешно!');
            navigate('/admin/profile');
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
        <div className="signup-container">
            <div className="signup-card">
                <h2 className="signup-title">Регистрация</h2>

                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="signup-form-group">
                        <label>Фамилия</label>
                        <input
                            type="text"
                            value={surname}
                            onChange={(e) => setSurname(e.target.value)}
                            required
                        />
                    </div>

                    <div className="signup-form-group">
                        <label>Имя</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="signup-form-group">
                        <label>Отчество</label>
                        <input
                            type="text"
                            value={middleName}
                            onChange={(e) => setMiddleName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="signup-form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="signup-form-group">
                        <label>Пароль</label>
                        <div className="password-wrapper-signup">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                        </div>
                    </div>

                    <div className="signup-form-group">
                        <label>Номер телефона</label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                        />
                    </div>

                    <div className="signup-error-container">
                        {error && <div className="signup-error-message">{error}</div>}
                    </div>

                    <button type="submit" disabled={loading} className="signup-button">
                        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminSignUp;