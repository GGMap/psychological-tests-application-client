import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminInfo from '../contexts/AdminInfo';
import '../css/pages/Home.css';

const Home = () => {
    const { isAuthenticated, user, token, isSuperAdmin } = useAuth();
    const navigate = useNavigate();

    const handleAdminLogin = () => {
        navigate('/admin/signin');
    };

    const handleAdminProfile = () => {
        navigate('/admin/profile');
    };


    return (
        <div className="home-page">
            {/* Верхняя зелёная полоса */}
            <header className="home-header">
                <div className="header-left">
                    <div className="logo-placeholder">Логотип БНТУ</div>
                </div>
                <div className="header-right">
                    {!isAuthenticated ? (
                        <button onClick={handleAdminLogin} className="login-button">
                            Войти
                        </button>
                    ) : (
                        <div className="admin-info">
                            <span className="admin-name">
                                <AdminInfo userId={user?.id} token={token} />
                            </span>
                            <span className="admin-role-badge">
                                {isSuperAdmin ? 'Супер-админ' : 'Администратор'}
                            </span>
                            <button onClick={handleAdminProfile} className="profile-button">
                                Профиль
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Вкладки — только Тесты для всех, для админов добавляются остальные */}
            <div className="tabs">
                <button className="tab active">Тесты</button>
                {isAuthenticated && (
                    <>
                        <button className="tab">Результаты</button>
                        {isSuperAdmin && <button className="tab">Администраторы</button>}
                    </>
                )}
            </div>

            {/* Контент вкладки Тесты (заглушка) */}
            <div className="tab-content">
                <div className="placeholder-content">
                    <h2>Доступные тесты</h2>
                    <p>Здесь будут отображаться тесты для прохождения студентами.</p>
                    {/* Позже добавим список тестов */}
                </div>
            </div>
        </div>
    );
};

export default Home;