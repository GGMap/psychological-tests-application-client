import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';


const AdminSignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const {login} = useAuth();

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('/api/auth/sign-in', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email: email, password: password}),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Ошибка входа!');
            }
            login(data.token);
            navigate('/admin/profile');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h2>Вход</h2>
            {error && <p>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label> Введите email: </label>
                    <input
                        type="text"
                        value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    />
                </div>
                <div>
                    <label> Пароль:</label>
                    <input
                    type="text"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    />
                </div>
                    <button type="submit">Войти</button>
            </form>
            <p>
                Нет аккаунта?! Ну и пошёл нахуй отсюда!
            </p>
        </div>
    );
};

export default AdminSignIn;