import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testsService } from '../services/testsService';
import '../css/pages/TestPassing.css';

const TestPassing = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [optionsMap, setOptionsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [results, setResults] = useState(null);

    const loadQuestions = useCallback(async () => {
        try {
            setLoading(true);
            let questionsData = await testsService.searchQuestions(testId);
            questionsData.sort((a, b) => (a.position || 0) - (b.position || 0));
            setQuestions(questionsData);
            const options = {};
            for (const q of questionsData) {
                options[q.id] = await testsService.searchAnswerOptions(q.id);
            }
            setOptionsMap(options);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [testId]);

    useEffect(() => {
        const studentId = sessionStorage.getItem('studentId');
        if (!studentId) {
            alert('Необходимо зарегистрироваться');
            navigate('/');
            return;
        }
        loadQuestions();
    }, [navigate, loadQuestions]);

    const handleAnswerSelect = (questionId, optionId) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const allQuestionsAnswered = () => {
        return questions.length > 0 && Object.keys(answers).length === questions.length;
    };

    const handleSubmit = async () => {
        // Проверяем, что все вопросы отвечены
        if (Object.keys(answers).length !== questions.length) {
            alert('Ответьте на все вопросы');
            return;
        }
        setSubmitting(true);
        try {
            const studentId = sessionStorage.getItem('studentId');
            const attempt = await testsService.createTestAttempt(studentId, testId);
            const attemptId = attempt.id;
            for (const [qId, optId] of Object.entries(answers)) {
                await testsService.sendStudentAnswer(attemptId, qId, optId);
            }
            const scores = await testsService.getTestScores(attemptId);
            const resultsWithScales = await Promise.all(scores.map(async (score) => {
                const scale = await testsService.getScaleById(score.scaleId);
                return { ...score, scaleName: scale.name };
            }));
            setResults(resultsWithScales);
        } catch (err) {
            alert('Ошибка при отправке результатов: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="test-passing-loading">Загрузка вопросов...</div>;
    if (error) return <div className="test-passing-error">{error}</div>;
    if (results) {
        return (
            <div className="test-results-container">
                <h2>Результаты тестирования</h2>
                {results.map(r => (
                    <div key={r.id} className="result-card">
                        <h3>{r.scaleName}</h3>
                        <p>Балл: {r.score}</p>
                        <p>Интерпретация: {r.interpretation}</p>
                    </div>
                ))}
                <button onClick={() => navigate('/')} className="back-home-btn">На главную</button>
            </div>
        );
    }

    return (
        <div className="test-passing-container">
            <div className="test-passing-header">
                <h2>Прохождение теста</h2>
                <div>Всего вопросов: {questions.length}</div>
            </div>
            <div className="test-passing-questions-list">
                {questions.map((question, idx) => {
                    const currentOptions = optionsMap[question.id] || [];
                    return (
                        <div key={question.id} className="test-question-card">
                            <div className="test-question-header">
                                <span className="test-question-number">Вопрос {question.position || idx + 1}</span>
                            </div>
                            <div className="test-question-text">{question.text}</div>
                            <div className="test-options-list">
                                {currentOptions.map(opt => (
                                    <label key={opt.id} className="test-option">
                                        <input
                                            type="radio"
                                            name={`question-${question.id}`}
                                            value={opt.id}
                                            checked={answers[question.id] === opt.id}
                                            onChange={() => handleAnswerSelect(question.id, opt.id)}
                                        />
                                        <span>{opt.text}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="test-submit-section">
                <button
                    className="submit-all-btn"
                    onClick={handleSubmit}
                    disabled={submitting || !allQuestionsAnswered()}
                >
                    {submitting ? 'Отправка...' : 'Завершить и получить результаты'}
                </button>
            </div>
        </div>
    );
};

export default TestPassing;