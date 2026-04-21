import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from "../contexts/AuthContext";
import {API_URL} from "../config";
import {handleUnauthorized} from "../contexts/authUtils";

const AdminSignUp = () => {
    const [surname, setSurname] = useState('');
    const [fullName, setFullName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const {token} = useAuth();

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');


        try {
            const response = await fetch(`${API_URL}/api/auth/sign-up`, {
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
                    phoneNumber: phoneNumber
                }),
            })

            if (handleUnauthorized(response)) return;

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Произошла ошибка регистрации!");
            }

            alert("Регистрация прошла успешно!");
            navigate('/admin/profile');
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div>
            <h2>Регистрация</h2>
            {error && <p>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label> Фамилия: </label>
                    <input
                        type="text"
                        value={surname}
                        onChange={e => setSurname(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label> Имя: </label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label> Отчество: </label>
                    <input
                        type="text"
                        value={middleName}
                        onChange={e => setMiddleName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label> Email: </label>
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
                <div>
                    <label> Номер телефона: </label>
                    <input
                        type="text"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Зарегистрироваться</button>
            </form>
        </div>
    );
};

export default AdminSignUp;