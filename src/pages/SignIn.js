import {useState} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';


const SignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const {login} = useAuth();

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:8080/api/auth/sign-in', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email: email, password: password}),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Ошибка входа!');
            }

            login(data.token);
            navigate('/');
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
                    <label> Имя пользователя или email: </label>
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
                Нет аккаунта?! Ну и пошёл нахуй отсюда <Link to="/signup">Зарегистрироваться</Link>
            </p>
        </div>
    );
};

export default SignIn;