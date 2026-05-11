import React, { useState, useEffect } from 'react';
import { testsService } from '../services/testsService';
import { useAuth } from '../contexts/AuthContext';
import '../css/pages/AdminResults.css';

const AdminResults = () => {
    const { token } = useAuth();
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [students, setStudents] = useState([]);
    const [tests, setTests] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedTestId, setSelectedTestId] = useState('');
    const [attemptDateFrom, setAttemptDateFrom] = useState('');
    const [attemptDateTo, setAttemptDateTo] = useState('');
    const [selectedAttempt, setSelectedAttempt] = useState(null);
    const [scores, setScores] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [showDetails, setShowDetails] = useState(false);
    // Кеш для текстов вопросов и вариантов
    const [questionsCache, setQuestionsCache] = useState({});
    const [optionsCache, setOptionsCache] = useState({});

    const parseDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('.');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year.length === 4) {
                return `${year}-${month}-${day}T00:00:00`;
            }
        }
        return dateStr;
    };

    // Загрузка списка студентов и тестов при монтировании
    useEffect(() => {
        const loadLists = async () => {
            try {
                const [studentsData, testsData] = await Promise.all([
                    testsService.searchStudents({}, token),
                    testsService.searchAllTests({}, token),
                ]);
                setStudents(studentsData);
                setTests(testsData);
            } catch (err) {
                console.error('Ошибка загрузки списков:', err);
            }
        };
        loadLists();
    }, [token]);

    // Поиск попыток по выбранным фильтрам
    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const filters = {};
        if (selectedStudentId) filters.studentId = selectedStudentId;
        if (selectedTestId) filters.testId = selectedTestId;
        if (attemptDateFrom) filters.attemptDateFrom = parseDate(attemptDateFrom);
        if (attemptDateTo) filters.attemptDateTo = parseDate(attemptDateTo);
        try {
            const data = await testsService.searchTestAttempts(filters, token);
            setAttempts(data);
            setSelectedAttempt(null);
            setScores([]);
            setAnswers([]);
            setShowDetails(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Получение текста вопроса по ID (с кешированием)
    const getQuestionText = async (questionId) => {
        if (questionsCache[questionId]) return questionsCache[questionId];
        try {
            const q = await testsService.getQuestionById(questionId);
            const text = q.text || `Вопрос ${questionId}`;
            setQuestionsCache(prev => ({ ...prev, [questionId]: text }));
            return text;
        } catch {
            return `Вопрос ${questionId}`;
        }
    };

    // Получение текста варианта ответа по ID
    const getOptionText = async (optionId) => {
        if (optionsCache[optionId]) return optionsCache[optionId];
        try {
            const opt = await testsService.getAnswerOptionById(optionId);
            const text = opt.text || `Вариант ${optionId}`;
            setOptionsCache(prev => ({ ...prev, [optionId]: text }));
            return text;
        } catch {
            return `Вариант ${optionId}`;
        }
    };

    const handleViewDetails = async (attempt) => {
        setSelectedAttempt(attempt);
        try {
            const [scoresData, answersData] = await Promise.all([
                testsService.searchTestScores(attempt.id, token),
                testsService.searchStudentAnswers(attempt.id, token),
            ]);
            // Обогащаем результаты шкал названиями шкал
            const scoresWithScales = await Promise.all(scoresData.map(async (s) => {
                let scaleName;
                try {
                    const scale = await testsService.getScaleById(s.scaleId);
                    scaleName = scale.name;
                } catch {
                    scaleName = 'Шкала';
                }
                return { ...s, scaleName };
            }));
            setScores(scoresWithScales);
            const answersWithText = await Promise.all(answersData.map(async (ans) => ({
                ...ans,
                questionText: await getQuestionText(ans.questionId),
                optionText: await getOptionText(ans.answerOptionId),
            })));
            setAnswers(answersWithText);
            setShowDetails(true);
        } catch (err) {
            console.error(err);
            alert('Не удалось загрузить детали');
        } finally {
            setLoading(false);
        }
    };

    const getStudentFullName = (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (student) return `${student.sname} ${student.fname} ${student.mname || ''}`.trim();
        return 'Загрузка...';
    };

    const getTestName = (testId) => {
        const test = tests.find(t => t.id === testId);
        return test ? test.name : 'Загрузка...';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';

        return new Date(dateStr + 'Z').toLocaleString();
    };

    return (
        <div className="admin-results-container">
            <h2>Результаты прохождения тестов</h2>
            <form onSubmit={handleSearch} className="admin-results-search-form">
                <div className="admin-results-form-row">
                    <div className="admin-results-form-group">
                        <label>Студент</label>
                        <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                            <option value="">Любой студент</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.sname} {s.fname} {s.mname || ''}</option>
                            ))}
                        </select>
                    </div>
                    <div className="admin-results-form-group">
                        <label>Тест</label>
                        <select value={selectedTestId} onChange={(e) => setSelectedTestId(e.target.value)}>
                            <option value="">Любой тест</option>
                            {tests.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="admin-results-form-row">
                    <div className="admin-results-form-group">
                        <label>Дата от</label>
                        <input
                            type="text"
                            value={attemptDateFrom}
                            onChange={(e) => setAttemptDateFrom(e.target.value)}
                            placeholder="01.01.2026"
                        />
                    </div>
                    <div className="admin-results-form-group">
                        <label>Дата до</label>
                        <input
                            type="text"
                            value={attemptDateTo}
                            onChange={(e) => setAttemptDateTo(e.target.value)}
                            placeholder="31.12.2026"
                        />
                    </div>
                </div>
                <button type="submit" disabled={loading} className="admin-results-search-btn">Поиск попыток</button>
            </form>

            {error && <div className="admin-results-error">{error}</div>}
            {loading && <div className="admin-results-loading">Загрузка...</div>}

            {!loading && attempts.length === 0 && <p>Ни одной попытки не найдено.</p>}

            {attempts.length > 0 && (
                <table className="admin-results-attempts-table">
                    <thead>
                    <tr>
                        <th>Студент</th>
                        <th>Тест</th>
                        <th>Дата попытки</th>
                        <th>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {attempts.map(attempt => (
                        <tr key={attempt.id}>
                            <td>{getStudentFullName(attempt.studentId)}</td>
                            <td>{getTestName(attempt.testId)}</td>
                            <td>{formatDate(attempt.attemptDate)}</td>
                            <td>
                                <button onClick={() => handleViewDetails(attempt)} className="admin-results-details-btn">Результаты</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {showDetails && selectedAttempt && (
                <div className="admin-results-attempt-details">
                    <h3>Детали попытки</h3>
                    <p>Студент: {getStudentFullName(selectedAttempt.studentId)}</p>
                    <p>Тест: {getTestName(selectedAttempt.testId)}</p>
                    <p>Дата: {new Date(selectedAttempt.attemptDate).toLocaleString()}</p>

                    <h4>Результаты по шкалам</h4>
                    {scores.length === 0 ? <p>Нет результатов</p> : (
                        <div className="admin-results-scores-list">
                            {scores.map(score => (
                                <div key={score.id} className="admin-results-score-card">
                                    <div className="admin-results-scale-name">{score.scaleName}</div>
                                    <div className="admin-results-score-value">Балл: {score.score}</div>
                                    <div className="admin-results-score-interpretation">{score.interpretation}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <h4>Ответы на вопросы</h4>
                    {answers.length === 0 ? <p>Нет ответов</p> : (
                        <div className="admin-results-answers-list">
                            {answers.map(ans => (
                                <div key={ans.id} className="admin-results-answer-item">
                                    <div className="admin-results-question-text">{ans.questionText}</div>
                                    <div className="admin-results-option-text">Выбранный вариант: {ans.optionText}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    <button onClick={() => setShowDetails(false)} className="admin-results-close-details-btn">Закрыть</button>
                </div>
            )}
        </div>
    );
};

export default AdminResults;