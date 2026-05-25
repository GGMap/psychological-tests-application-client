import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { testsService } from '../services/testsService';
import '../css/pages/Home.css';
import StudentRegistrationModal from '../components/StudentRegistrationModal';
import LogoBNTU from '../logo/Logo_BNTU.png';

const Home = () => {
    const { isAuthenticated, isSuperAdmin } = useAuth();
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('tests');
    const [isRegModalOpen, setIsRegModalOpen] = useState(false);
    const [selectedTestId, setSelectedTestId] = useState(null);
    const hasLoggedIn = sessionStorage.getItem('loggedInThisSession') === 'true';
    const showAdminTabs = isAuthenticated && hasLoggedIn;

    useEffect(() => {
        const fetchTests = async () => {
            try {
                setLoading(true);
                const data = await testsService.searchTests({ isActive: true });
                setTests(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTests().catch(err => console.error('Ошибка при загрузке тестов:', err));
    }, []);

    const handleAdminLogin = () => {
        navigate('/admin/signin');
    };

    const handleAdminProfile = () => {
        navigate('/admin/profile');
    };

    const filteredTests = tests.filter(test =>
        test.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleStartTest = (testId) => {
        setSelectedTestId(testId);
        setIsRegModalOpen(true);
    };

    const handleStudentRegistered = (studentId) => {
        sessionStorage.setItem('studentId', studentId);
        window.location.href = `/test/${selectedTestId}`;
    };

    return (
        <div className="home-page">
            <header className="home-header">
                <div className="home-header-left">
                    <img src={LogoBNTU} alt="Логотип БНТУ" className="logo-image" />
                </div>

                <div className="home-header-center">
                    <button
                        className={`home-tab ${activeTab === 'tests' ? 'home-tab-active' : ''}`}
                        onClick={() => setActiveTab('tests')}
                    >
                        Тесты
                    </button>
                    {showAdminTabs && (
                        <>
                            <button
                                className={`home-tab ${activeTab === 'results' ? 'home-tab-active' : ''}`}
                                onClick={() => setActiveTab('results')}
                            >
                                Результаты
                            </button>
                            {isSuperAdmin && (
                                <button
                                    className={`home-tab ${activeTab === 'admins' ? 'home-tab-active' : ''}`}
                                    onClick={() => setActiveTab('admins')}
                                >
                                    Администраторы
                                </button>
                            )}
                        </>
                    )}
                </div>

                <div className="home-header-right">
                    {!showAdminTabs ? (
                        <button onClick={handleAdminLogin} className="home-login-button">Войти</button>
                    ) : (
                        <button onClick={handleAdminProfile} className="home-profile-button">Профиль</button>
                    )}
                </div>
            </header>

            <div className="home-tab-content">
                {activeTab === 'tests' && (
                    <div className="home-tests-container">
                        <div className="home-search-bar">
                            <input
                                type="text"
                                placeholder="Название..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {loading && <div className="home-loading">Загрузка тестов...</div>}
                        {error && <div className="home-error-message">{error}</div>}

                        {!loading && !error && (
                            <table className="home-tests-table">
                                <tbody>
                                {filteredTests.length === 0 ? (
                                    <tr>
                                        <td className="home-no-tests" colSpan="1">Нет доступных тестов</td>
                                    </tr>
                                ) : (
                                    filteredTests.map(test => (
                                        <tr key={test.id}>
                                            <td className="home-test-cell">
                                                <span className="home-test-name">{test.name}</span>
                                                <button
                                                    className="home-test-button"
                                                    onClick={() => handleStartTest(test.id)}
                                                >
                                                    Пройти тест
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
                {activeTab === 'results' && (
                    <div className="home-placeholder-content">
                        <h2>Результаты тестирования</h2>
                        <p>Здесь будут отображаться ваши результаты.</p>
                    </div>
                )}
                {activeTab === 'admins' && isSuperAdmin && (
                    <div className="home-placeholder-content">
                        <h2>Управление администраторами</h2>
                        <p>Полный функционал доступен в профиле администратора.</p>
                    </div>
                )}
            </div>
            <StudentRegistrationModal
                isOpen={isRegModalOpen}
                onClose={() => setIsRegModalOpen(false)}
                testId={selectedTestId}
                onSuccess={handleStudentRegistered}
            />
        </div>
    );
};

export default Home;