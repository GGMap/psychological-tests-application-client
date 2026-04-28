import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import { handleUnauthorized } from '../contexts/authUtils';
import '../css/pages/AdminSignUp.css';

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

            alert('Регистрация прошла успешно!');
            navigate('/admin/profile');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
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