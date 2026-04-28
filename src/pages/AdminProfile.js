import React, {useEffect, useState, useCallback} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminInfo from '../contexts/AdminInfo';
import { useAdminActions } from '../hooks/useAdminActions';
import { adminService } from '../services/adminService';
import '../css/pages/AdminProfile.css';
import '../css/components/ChangePasswordModal.css';
import ChangePasswordModal from "../components/ChangePasswordModal";

const AdminProfile = () => {
    const { logout, user, token, isSuperAdmin } = useAuth();
    const navigate = useNavigate();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordChangeTarget, setPasswordChangeTarget] = useState(null);
    const [activeTab, setActiveTab] = useState('admins');
    const [searchParams, setSearchParams] = useState({
        sname: '',
        fname: '',
        mname: '',
        email: '',
        phoneNumber: '',
        role: '',
        isActive: ''
    });
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const {
        activateAdmin,
        deactivateAdmin,
        message,
        error,
        clearMessages
    } = useAdminActions(token, () => handleSearch(new Event('submit')));

    useEffect(() => {
        if (message || error) {
            const timer = setTimeout(() => {
                clearMessages();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, error, clearMessages]);

    const canManageAdmin = (targetAdmin) => {
        if (targetAdmin.id === user?.id) {
            return { allowed: false, reason: 'Нельзя управлять самим собой' };
        }
        if (!isSuperAdmin) {
            return { allowed: false, reason: 'Только супер-администратор может управлять другими администраторами' };
        }
        if (targetAdmin.role === 'SUPER') {
            return { allowed: false, reason: 'Супер-администратор не может управлять другими супер-администраторами' };
        }
        return { allowed: true, reason: '' };
    };

    const handleOpenSelfPasswordModal = () => {
        setPasswordChangeTarget(null);
        setIsPasswordModalOpen(true);
    };

    const handleOpenAdminPasswordModal = (adminId, adminFullName) => {
        setPasswordChangeTarget({ id: adminId, name: adminFullName });
        setIsPasswordModalOpen(true);
    };

    const handlePasswordChangeSuccess = () => {
        alert('Пароль успешно изменён');
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleSearchInputChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = useCallback(async (e = null) => {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }
        setSearchLoading(true);
        const body = {};
        for (const [key, value] of Object.entries(searchParams)) {
            if (value && value !== '') {
                body[key] = key === 'isActive' ? value === 'true' : value;
            }
        }
        try {
            const data = await adminService.searchAdmins(body, token);
            setSearchResults(data);
        } catch (err) {
            console.error('Ошибка поиска:', err);
        } finally {
            setSearchLoading(false);
        }
    }, [searchParams, token]);

    useEffect(() => {
        if (activeTab === 'admins') {
            handleSearch().catch(err => {
                console.error('Ошибка при загрузке администраторов:', err);
            });
        }
    }, [isSuperAdmin, activeTab, handleSearch]);

    const handleCreateAdmin = () => {
        navigate('/admin/signup');
    };

    return (
        <div className="admin-profile">
            {/* Верхняя зелёная полоса */}
            <header className="admin-header">
                <div className="header-left">
                    <div className="logo-placeholder">Логотип БНТУ</div>
                </div>
                <div className="header-right">
                    <div className="admin-info">
                        <span className="admin-name">
                            <AdminInfo userId={user?.id} token={token} />
                        </span>
                        <span className="admin-role-badge">
                            {isSuperAdmin ? 'Супер-админ' : 'Администратор'}
                        </span>
                        <button onClick={handleLogout} className="logout-button">Выйти</button>
                    </div>
                </div>
            </header>

            {/* Вкладки */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'tests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tests')}
                >
                    Тесты
                </button>
                <button
                    className={`tab ${activeTab === 'results' ? 'active' : ''}`}
                    onClick={() => setActiveTab('results')}
                >
                    Результаты
                </button>
                {isSuperAdmin && (
                    <button
                        className={`tab ${activeTab === 'admins' ? 'active' : ''}`}
                        onClick={() => setActiveTab('admins')}
                    >
                        Администраторы
                    </button>
                )}
            </div>

            {/* Контент вкладок */}
            <div className="tab-content">
                {activeTab === 'tests' && (
                    <div className="placeholder-content">
                        <h2>Управление тестами</h2>
                        <p>Здесь будет функционал для создания/редактирования тестов (заглушка).</p>
                    </div>
                )}
                {activeTab === 'results' && (
                    <div className="placeholder-content">
                        <h2>Результаты тестирования</h2>
                        <p>Здесь будет отображаться статистика и результаты пользователей (заглушка).</p>
                    </div>
                )}
                {activeTab === 'admins' && isSuperAdmin && (
                    <div className="admin-management">
                        <div className="management-header">
                            <h2>Управление администраторами</h2>
                            <button onClick={handleCreateAdmin} className="create-admin-btn">
                                + Создать нового администратора
                            </button>
                        </div>

                        {/* Сообщения об успехе/ошибке */}
                        {message && <div className="success-message">{message}</div>}
                        {error && <div className="error-message">{error}</div>}

                        {/* Форма поиска (без поля ID) */}
                        <form onSubmit={handleSearch} className="search-form">
                            <div className="search-fields">
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
                                <button type="submit" disabled={searchLoading} className="search-btn">
                                    {searchLoading ? 'Поиск...' : 'Поиск'}
                                </button>
                            </div>
                        </form>

                        {/* Результаты поиска */}
                        {!searchLoading && searchResults.length === 0 && (
                            <div className="no-results">Ничего не найдено</div>
                        )}
                        {searchResults.length > 0 && (
                            <div className="table-responsive">
                                <table className="admins-table">
                                    <thead>
                                    <tr>
                                        <th>Фамилия</th>
                                        <th>Имя</th>
                                        <th>Отчество</th>
                                        <th>Email</th>
                                        <th>Телефон</th>
                                        <th>Роль</th>
                                        <th>Статус</th>
                                        <th>Действия</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {searchResults.map(admin => {
                                        const { allowed, reason } = canManageAdmin(admin);
                                        const fullName = [admin.sname, admin.fname, admin.mname].filter(p => p).join(' ') || admin.email;

                                        return (
                                            <tr key={admin.id} className={admin.id === user?.id ? 'current-user' : ''}>
                                                <td data-label="Фамилия">{admin.sname || '—'}</td>
                                                <td data-label="Имя">{admin.fname || '—'}</td>
                                                <td data-label="Отчество">{admin.mname || '—'}</td>
                                                <td data-label="Email">{admin.email}</td>
                                                <td data-label="Телефон">{admin.phoneNumber || '—'}</td>
                                                <td data-label="Роль" className={`role-${admin.role?.toLowerCase()}`}>
                                                    {admin.role === 'SUPER' ? 'Супер-админ' : 'Админ'}
                                                </td>
                                                <td data-label="Статус" className={`status-${admin.isActive ? 'active' : 'inactive'}`}>
                                                    {admin.isActive ? 'Активен' : 'Неактивен'}
                                                </td>
                                                <td data-label="Действия" className="actions-cell">

                                                    {/* Кнопка смены пароля для текущего пользователя */}
                                                    {isSuperAdmin && admin.id === user?.id && (
                                                        <button onClick={handleOpenSelfPasswordModal} className="action-btn change-password">
                                                            Сменить пароль
                                                        </button>
                                                    )}

                                                    {/* Кнопка смены пароля для супер-админа (для других STANDARD) */}
                                                    {isSuperAdmin && admin.id !== user?.id && admin.role !== 'SUPER' && (
                                                        <button
                                                            onClick={() => handleOpenAdminPasswordModal(admin.id, fullName)}
                                                            className="action-btn change-password"
                                                        >
                                                            Сменить пароль
                                                        </button>
                                                    )}

                                                    {/* Кнопки активации/деактивации */}
                                                    {admin.id !== user?.id && (
                                                        admin.isActive ? (
                                                            <button
                                                                onClick={() => deactivateAdmin(admin.id, admin.role)}
                                                                disabled={!allowed}
                                                                title={!allowed ? reason : ''}
                                                                className="action-btn deactivate"
                                                            >
                                                                Деактивировать
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => activateAdmin(admin.id, admin.role)}
                                                                disabled={!allowed}
                                                                title={!allowed ? reason : ''}
                                                                className="action-btn activate"
                                                            >
                                                                Активировать
                                                            </button>
                                                        )
                                                    )}
                                                    {/* Метка для текущего пользователя */}
                                                    {admin.id === user?.id && <span className="self-hint">(Вы)</span>}

                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Модальное окно смены пароля */}
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                userId={passwordChangeTarget?.id}
                userName={passwordChangeTarget?.name}
                currentAdminId={user?.id}
                token={token}
                onSuccess={handlePasswordChangeSuccess}
            />
        </div>
    );
};

export default AdminProfile;