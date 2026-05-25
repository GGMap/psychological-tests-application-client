import React, {useEffect, useState, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {useLocation} from 'react-router-dom';
import AdminInfo from '../contexts/AdminInfo';
import {useAdminActions} from '../hooks/useAdminActions';
import {adminService} from '../services/adminService';
import '../css/pages/AdminProfile.css';
import '../css/components/EditProfileModal.css';
import EditProfileModal from "../components/EditProfileModal";
import {testsService} from '../services/testsService';
import AdminResults from './AdminResults';
import LogoBNTU from '../logo/Logo_BNTU.png';
import toast from 'react-hot-toast';

const AdminProfile = () => {
    const {logout, user, token, isSuperAdmin} = useAuth();
    const navigate = useNavigate();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileTarget, setProfileTarget] = useState(null);
    const [activeTab, setActiveTab] = useState('results');
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
    const [adminTests, setAdminTests] = useState([]);
    const [testsLoading, setTestsLoading] = useState(false);
    const [testsError, setTestsError] = useState('');
    const [testSearchTerm, setTestSearchTerm] = useState('');
    const location = useLocation();

    useEffect(() => {
        if (message || error) {
            const timer = setTimeout(() => {
                clearMessages();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, error, clearMessages]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab && ['tests', 'results', 'admins'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [location.search]);

    const canManageAdmin = (targetAdmin) => {
        if (targetAdmin.id === user?.id) {
            return {allowed: false, reason: 'Нельзя управлять самим собой'};
        }
        if (!isSuperAdmin) {
            return {allowed: false, reason: 'Только супер-администратор может управлять другими администраторами'};
        }
        if (targetAdmin.role === 'SUPER') {
            return {allowed: false, reason: 'Супер-администратор не может управлять другими супер-администраторами'};
        }
        return {allowed: true, reason: ''};
    };

    const handleOpenSelfProfileModal = () => {
        setProfileTarget(null);
        setIsProfileModalOpen(true);
    };

    const handleOpenAdminProfileModal = (adminId, adminName) => {
        setProfileTarget({id: adminId, name: adminName});
        setIsProfileModalOpen(true);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleSearchInputChange = (e) => {
        const {name, value} = e.target;
        setSearchParams(prev => ({...prev, [name]: value}));
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

    const fetchAllTests = useCallback(async () => {
        setTestsLoading(true);
        setTestsError('');
        try {
            const data = await testsService.searchAllTests({}, token);
            const sortedTests = [...data].sort((a, b) =>
                (a.name || '').localeCompare(b.name || '')
            );
            setAdminTests(sortedTests);
        } catch (err) {
            setTestsError(err.message);
        } finally {
            setTestsLoading(false);
        }
    }, [token]);

    const handleToggleTestStatus = async (testId, currentStatus) => {
        try {
            await testsService.updateTestStatus(testId, !currentStatus, token);
            await fetchAllTests();
        } catch (err) {
            console.log(`Ошибка: ${err.message}`);
        }
    };

    useEffect(() => {
        if (activeTab === 'tests') {
            fetchAllTests().catch(err => {
                console.error('Ошибка загрузки тестов:', err);
            });
        }
    }, [activeTab, fetchAllTests]);

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

    const handleDeleteTest = async (testId) => {
        if (!window.confirm('Удалить тест? Все вопросы, варианты ответов и прохождения будут удалены без возможности восстановления.')) return;
        try {
            await testsService.deleteTest(testId, token);
            toast.success('Тест удалён');
            await fetchAllTests();
        } catch (err) {
            toast.error('Ошибка удаления теста: ' + err.message);
        }
    };

    return (
        <div className="admin-profile">
            <header className="admin-header">
                <div className="header-left">
                    <img src={LogoBNTU} alt="Логотип БНТУ" className="logo-image"/>
                </div>
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
                    <button
                        className={`tab ${activeTab === 'admins' ? 'active' : ''}`}
                        onClick={() => setActiveTab('admins')}
                    >
                        Администраторы
                    </button>
                </div>

                    <div className="header-right">
                        <div className="admin-info">
                        <span className="admin-name">
                            <AdminInfo userId={user?.id} token={token}/>
                        </span>
                            <span className="admin-role-badge">
                            {isSuperAdmin ? 'Супер-админ' : 'Администратор'}
                        </span>
                            <button onClick={handleLogout} className="logout-button">Выйти</button>
                        </div>
                    </div>

            </header>
            {/* Контент вкладок */}
            <div className="tab-content">
                {activeTab === 'tests' && (
                    <div className="admin-tests-container">
                        <div className="admin-tests-header">
                        <button onClick={() => navigate('/admin/test-builder')} className="create-test-btn">
                            + Создать тест
                        </button>
                        </div>
                        <div className="admin-search-bar">
                            <input
                                type="text"
                                placeholder="Поиск по названию..."
                                value={testSearchTerm}
                                onChange={(e) => setTestSearchTerm(e.target.value)}
                            />
                        </div>

                        {testsLoading && <div className="admin-loading">Загрузка тестов...</div>}
                        {testsError && <div className="admin-error-message">{testsError}</div>}

                        {!testsLoading && !testsError && (
                            <table className="admin-tests-table">
                                <thead>
                                <tr>
                                    <th>Название</th>
                                    <th>Статус</th>
                                    <th>Действия</th>
                                </tr>
                                </thead>
                                <tbody>
                                {adminTests
                                    .filter(test => test.name?.toLowerCase().includes(testSearchTerm.toLowerCase()))
                                    .map(test => (
                                        <tr key={test.id}>
                                            <td className="admin-test-name">{test.name}</td>
                                            <td className={`admin-test-status ${test.isActive ? 'active' : 'inactive'}`}>
                                                {test.isActive ? 'Активен' : 'Неактивен'}
                                            </td>
                                            <td className="admin-test-actions">
                                                <button
                                                    className={`admin-test-toggle-btn ${test.isActive ? 'close' : 'open'}`}
                                                    onClick={() => handleToggleTestStatus(test.id, test.isActive)}
                                                >
                                                    {test.isActive ? 'Закрыть' : 'Открыть'}
                                                </button>
                                                <button
                                                    className="admin-test-edit-btn"
                                                    onClick={() => navigate(`/admin/test/${test.id}`)}
                                                >
                                                    Редактировать
                                                </button>
                                                {isSuperAdmin && (
                                                    <button
                                                        className="admin-test-delete-btn"
                                                        onClick={() => handleDeleteTest(test.id)}
                                                    >
                                                        Удалить тест
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                {adminTests.filter(t => t.name?.toLowerCase().includes(testSearchTerm.toLowerCase())).length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="admin-no-tests">Тесты не найдены</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
                {activeTab === 'results' && (
                    <AdminResults />
                )}
                {activeTab === 'admins' && (
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

                        {/* Форма поиска */}
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
                                        const {allowed, reason} = canManageAdmin(admin);
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
                                                <td data-label="Статус"
                                                    className={`status-${admin.isActive ? 'active' : 'inactive'}`}>
                                                    {admin.isActive ? 'Активен' : 'Неактивен'}
                                                </td>
                                                <td data-label="Действия" className="actions-cell">

                                                    {/* Кнопка смены пароля для текущего пользователя */}
                                                    {admin.id === user?.id && (
                                                        <button onClick={handleOpenSelfProfileModal}
                                                                className="action-btn change-password">
                                                            Редактировать
                                                        </button>
                                                    )}

                                                    {/* Кнопка смены пароля для супер-админа */}
                                                    {isSuperAdmin && admin.id !== user?.id && admin.role !== 'SUPER' && (
                                                        <button
                                                            onClick={() => handleOpenAdminProfileModal(admin.id, fullName)}
                                                            className="action-btn change-password"
                                                        >
                                                            Редактировать
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
            <EditProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                userId={profileTarget?.id}
                currentAdminId={user?.id}
                token={token}
                onSuccess={() => {
                    handleSearch(new Event('submit')).then();
                }}
            />
        </div>
    );
};

export default AdminProfile;