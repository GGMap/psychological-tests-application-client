import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';

const AdminProfile = () => {
    const {logout, user, token, isSuperAdmin} = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useState({
        id: '',
        sname: '',
        fname: '',
        mname: '',
        email: '',
        phoneNumber: '',
        role: '',
        isActive: ''
    });
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [userSurname, setUserSurname] = useState('');
    const [userFirstName, setUserFirstName] = useState('');
    const [userMiddleName, setUserMiddleName] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/');
    }

    //Обновление полей поиска
    const handleSearchInputChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({ ...prev, [name]: value }));
    };

    //Поиск из списка администраторов
    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setSearchResults([]);

        const body = {};
        for (const [key, value] of Object.entries(searchParams)) {
            if (value !== undefined && value !== null && value !== '') {
                if (key === 'isActive' && value !== '') {
                    body[key] = value === 'true';
                } else {
                    body[key] = value;
                }
            }
        }

        try {
            const response = await fetch('http://localhost:8080/api/admins/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ошибка поиска');
            setSearchResults(data);
        } catch (err) {
            setMessage(`Ошибка: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    //Активация администратора
    const activateAdmin = async (adminId) => {
        setLoading(true);
        setMessage('');
        try {
            const response = await fetch(`http://localhost:8080/api/admins/${adminId}/activate`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Ошибка активации');
            }

            setMessage(`Администратор успешно активирован`);
            await handleSearch(new Event('submit'));
        } catch (err) {
            setMessage(`Ошибка: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    //Деактивация админа
    const deactivateAdmin = async (adminId) => {
        setLoading(true);
        setMessage('');
        try {
            const response = await fetch(`http://localhost:8080/api/admins/${adminId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Ошибка деактивации');
            }

            setMessage(`Администратор успешно деактивирован`);
            handleSearch(new Event('submit'));
        } catch (err) {
            setMessage(`Ошибка: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = () => {
        navigate('/admin/signup');
    }

    // const getRoleName = (role) => {
    //     if (role === 'SUPER') return 'Супер-администратор';
    //     if (role === 'STANDARD') return 'Администратор';
    //     return role;
    // }

    const handleAdminName = async () => {
        const response = await fetch(`/api/admins/${user?.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) {
            setError(data.message || 'Ошибка!');
        }
    }

    return (
        <div className="admin-profile">
            <h1>
                {error && <p>{error}</p>}
                Профиль администратора
                {user?.role && (
                    <span className="admin-role">
                        ({isSuperAdmin ? 'Супер-администратор' : 'Администратор'})
                    </span>
                )}
            </h1>
            <p><strong>Email:</strong> {user?.email}</p>
            <button onClick={handleLogout} className="logout-btn">Выход</button>
            <button onClick={handleCreateAdmin}> Создать нового администратора</button>
            {/* Панель управления администраторами только для супер администратора */}
            {isSuperAdmin && (
                <div className="admin-management">
                    <h2>Управление администраторами</h2>

                    {/* Форма поиска */}
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="search-fields">
                            <input
                                name="id"
                                placeholder="ID"
                                value={searchParams.id}
                                onChange={handleSearchInputChange}
                            />
                            <input
                                name="sname"
                                placeholder="Фамилия"
                                value={searchParams.sname}
                                onChange={handleSearchInputChange}
                            />
                            <input
                                name="fname"
                                placeholder="Имя"
                                value={searchParams.fname}
                                onChange={handleSearchInputChange}
                            />
                            <input
                                name="mname"
                                placeholder="Отчество"
                                value={searchParams.mname}
                                onChange={handleSearchInputChange}
                            />
                            <input
                                name="email"
                                placeholder="Email"
                                value={searchParams.email}
                                onChange={handleSearchInputChange}
                            />
                            <input
                                name="phoneNumber"
                                placeholder="Телефон"
                                value={searchParams.phoneNumber}
                                onChange={handleSearchInputChange}
                            />
                            <select
                                name="role"
                                value={searchParams.role}
                                onChange={handleSearchInputChange}
                            >
                                <option value="">Любая роль</option>
                                <option value="STANDARD">STANDARD</option>
                                <option value="SUPER">SUPER</option>
                            </select>
                            <select
                                name="isActive"
                                value={searchParams.isActive}
                                onChange={handleSearchInputChange}
                            >
                                <option value="">Любой статус</option>
                                <option value="true">Активен</option>
                                <option value="false">Неактивен</option>
                            </select>
                            <button type="submit" disabled={loading} className="search-btn">
                                {loading ? 'Поиск...' : 'Поиск'}
                            </button>
                        </div>
                    </form>

                    {message && (
                        <div className={`message ${message.includes('Ошибка') ? 'error' : 'success'}`}>
                            {message}
                        </div>
                    )}

                    {/* Результаты поиска */}
                    {loading && <div className="loading">Загрузка...</div>}
                    {!loading && searchResults.length === 0 && <div className="no-results">Ничего не найдено</div>}
                    {searchResults.length > 0 && (
                        <table className="admins-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Email</th>
                                <th>Имя</th>
                                <th>Фамилия</th>
                                <th>Роль</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                            </thead>
                            <tbody>
                            {searchResults.map(admin => (
                                <tr key={admin.id}>
                                    <td className="admin-id">{admin.id}</td>
                                    <td>{admin.email}</td>
                                    <td>{admin.firstName || admin.fname || '-'}</td>
                                    <td>{admin.lastName || admin.sname || '-'}</td>
                                    <td>
                                            <span className={`role-${admin.role?.toLowerCase()}`}>
                                                {admin.role}
                                            </span>
                                    </td>
                                    <td>
                                            <span className={`status-${admin.isActive ? 'active' : 'inactive'}`}>
                                                {admin.isActive ? 'Активен' : 'Неактивен'}
                                            </span>
                                    </td>
                                    <td>
                                        {admin.isActive ? (
                                            <button
                                                onClick={() => deactivateAdmin(admin.id)}
                                                className="deactivate-btn"
                                            >
                                                Деактивировать
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => activateAdmin(admin.id)}
                                                className="activate-btn"
                                            >
                                                Активировать
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminProfile;