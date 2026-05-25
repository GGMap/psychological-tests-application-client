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
    const [completed, setCompleted] = useState(false);

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

    // Обработка выбора для одиночного выбора
    const handleSingleChoice = (questionId, optionId) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    // Обработка выбора для множественного выбора
    const handleMultipleChoice = (questionId, optionId, checked) => {
        setAnswers(prev => {
            const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
            if (checked) {
                return { ...prev, [questionId]: [...current, optionId] };
            } else {
                return { ...prev, [questionId]: current.filter(id => id !== optionId) };
            }
        });
    };

    const allQuestionsAnswered = () => {
        for (const q of questions) {
            const answer = answers[q.id];
            if (q.type === 'MULTIPLE_CHOICE') {
                if (!answer) return false;
            } else if (q.type === 'CHECKBOXES') {
                if (!answer || (Array.isArray(answer) && answer.length === 0)) return false;
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!allQuestionsAnswered()) {
            setError('Ответьте на все вопросы');
            return;
        }
        setSubmitting(true);
        try {
            const studentId = sessionStorage.getItem('studentId');
            const attempt = await testsService.createTestAttempt(studentId, testId);
            const attemptId = attempt.id;
            for (const q of questions) {
                const qId = q.id;
                const answer = answers[qId];
                if (q.type === 'MULTIPLE_CHOICE') {
                    await testsService.sendStudentAnswer(attemptId, qId, answer);
                } else if (q.type === 'CHECKBOXES') {
                    for (const optId of answer) {
                        await testsService.sendStudentAnswer(attemptId, qId, optId);
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            setCompleted(true);
        } catch (err) {
            setError('Ошибка при отправке результатов: ' + err.message);
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="test-passing-loading">Загрузка вопросов...</div>;
    if (error) return <div className="test-passing-error">{error}</div>;
    if (completed) {
        return (
            <div className="test-thanks-container">
                <div className="thanks-card">
                    <h2>Спасибо за прохождение тестирования!</h2>
                    <button onClick={() => navigate('/')} className="back-home-btn">На главную</button>
                </div>
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
                    const isMultiple = question.type === 'CHECKBOXES';
                    const currentAnswer = answers[question.id];
                    const isChecked = (optionId) => {
                        if (isMultiple) return Array.isArray(currentAnswer) && currentAnswer.includes(optionId);
                        return currentAnswer === optionId;
                    };
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
                                            type={isMultiple ? 'checkbox' : 'radio'}
                                            name={`question-${question.id}`}
                                            value={opt.id}
                                            checked={isChecked(opt.id)}
                                            onChange={(e) => {
                                                if (isMultiple) {
                                                    handleMultipleChoice(question.id, opt.id, e.target.checked);
                                                } else {
                                                    handleSingleChoice(question.id, opt.id);
                                                }
                                            }}
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
                    {submitting ? 'Отправка...' : 'Завершить анкетирование'}
                </button>
            </div>
        </div>
    );
};

export default TestPassing;