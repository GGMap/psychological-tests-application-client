import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {testsService} from '../services/testsService';
import AdminInfo from '../contexts/AdminInfo';
import '../css/pages/TestView.css';
import LogoBNTU from '../logo/Logo_BNTU.png';
import toast from "react-hot-toast";

const TestView = () => {
    const {testId} = useParams();
    const navigate = useNavigate();
    const {user, isSuperAdmin, token} = useAuth();
    const [questions, setQuestions] = useState([]);
    const [optionsMap, setOptionsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [methodologyScales, setMethodologyScales] = useState([]);
    const [scaleQuestions, setScaleQuestions] = useState({});

    // Загрузка данных
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const testInfo = await testsService.getTestById(testId);
                const methodologyId = testInfo.methodologyId;

                const scales = await testsService.searchScales({ methodologyId }, token);
                setMethodologyScales(scales);
                let questionsData = await testsService.searchQuestions(testId, token);
                questionsData.sort((a, b) => (a.position || 0) - (b.position || 0));
                setQuestions(questionsData);

                const options = {};
                const scaleLinks = {};
                for (const q of questionsData) {
                    options[q.id] = await testsService.searchAnswerOptions(q.id, token);
                    const links = await testsService.searchScaleQuestions({ questionId: q.id }, token);
                    scaleLinks[q.id] = links.map(l => l.scaleId);
                }
                setOptionsMap(options);
                setScaleQuestions(scaleLinks);
                setError('');
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData().catch(console.error);
    }, [testId, token]);

    const handleBack = () => {
        if (hasChanges && !window.confirm('Есть несохранённые изменения. Всё равно перейти?')) {
            return;
        }
        navigate('/admin/profile?tab=tests');
    };

    // Редактирование вопросов
    const handleQuestionTextChange = (qId, newText) => {
        setQuestions(prev => prev.map(q => q.id === qId ? {...q, text: newText} : q));
        setHasChanges(true);
    };

    const handleTypeChange = (qId, newType) => {
        setQuestions(prev => prev.map(q => q.id === qId ? {...q, type: newType} : q));
        setHasChanges(true);
    };

    const handleOptionTextChange = (qId, optId, newText) => {
        setOptionsMap(prev => ({
            ...prev,
            [qId]: prev[qId].map(opt => opt.id === optId ? {...opt, text: newText} : opt)
        }));
        setHasChanges(true);
    };

    const handleOptionScoreChange = (qId, optId, newScore) => {
        setOptionsMap(prev => ({
            ...prev,
            [qId]: prev[qId].map(opt => opt.id === optId ? {...opt, score: newScore} : opt)
        }));
        setHasChanges(true);
    };

    const addOption = (qId) => {
        const newOption = {
            id: `temp-${Date.now()}-${Math.random()}`,
            questionId: qId,
            text: 'Новый вариант',
            score: 0,
            isNew: true,
        };
        setOptionsMap(prev => ({
            ...prev,
            [qId]: [...(prev[qId] || []), newOption]
        }));
        setHasChanges(true);
    };

    const deleteOption = async (qId, optId) => {
        const option = optionsMap[qId]?.find(o => o.id === optId);
        if (option && !option.isNew) {
            try {
                await testsService.deleteAnswerOption(optId, token);
            } catch (err) {
                toast.error('Не удалось удалить вариант: ' + err.message);
                return;
            }
        }
        setOptionsMap(prev => ({
            ...prev,
            [qId]: prev[qId].filter(o => o.id !== optId)
        }));
        setHasChanges(true);
    };

    const deleteQuestion = async (qId) => {
        const confirm = window.confirm('Удалить вопрос и все его варианты?');
        if (!confirm) return;
        const isTemp = qId.startsWith('temp-question');
        if (!isTemp) {
            try {
                await testsService.deleteQuestion(qId, token);
            } catch (err) {
                toast.error('Ошибка удаления вопроса: ' + err.message);
                return;
            }
        }
        setQuestions(prev => prev.filter(q => q.id !== qId));
        setOptionsMap(prev => {
            const newMap = { ...prev };
            delete newMap[qId];
            return newMap;
        });
        setScaleQuestions(prev => {
            const newMap = { ...prev };
            delete newMap[qId];
            return newMap;
        });
        setHasChanges(true);
    };

    const handleScaleToggle = (qId, scaleId) => {
        setScaleQuestions(prev => {
            const current = prev[qId] || [];
            const newScales = current.includes(scaleId)
                ? current.filter(id => id !== scaleId)
                : [...current, scaleId];
            return { ...prev, [qId]: newScales };
        });
        setHasChanges(true);
    };

    // Сохранение всех изменений
    const saveAllChanges = async () => {
        try {
            const newQuestions = [];
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (q.id.startsWith('temp-question')) {
                    const created = await testsService.createQuestion({
                        testId: testId,
                        text: q.text,
                        type: q.type,
                        position: i + 1,
                    }, token);
                    newQuestions.push(created);
                } else {
                    await testsService.updateQuestion(q.id, {
                        testId: testId,
                        text: q.text,
                        type: q.type,
                        position: i + 1,
                    }, token);
                    newQuestions.push(q);
                }
            }
            const updatedQuestions = await testsService.searchQuestions(testId, token);
            updatedQuestions.sort((a, b) => (a.position || 0) - (b.position || 0));
            setQuestions(updatedQuestions);

            const idMap = {};
            for (let i = 0; i < questions.length; i++) {
                const oldId = questions[i].id;
                const newId = updatedQuestions[i].id;
                if (oldId !== newId) idMap[oldId] = newId;
            }
            // Сохраняем варианты
            for (const oldQId of Object.keys(optionsMap)) {
                const realQId = idMap[oldQId] || oldQId;
                for (const opt of optionsMap[oldQId]) {
                    if (opt.isNew) {
                        await testsService.createAnswerOption({
                            questionId: realQId,
                            text: opt.text,
                            score: opt.score,
                        }, token);
                    } else {
                        await testsService.updateAnswerOption(opt.id, {
                            questionId: realQId,
                            text: opt.text,
                            score: opt.score,
                        }, token);
                    }
                }
            }

            for (const oldQId of Object.keys(scaleQuestions)) {
                const realQId = idMap[oldQId] || oldQId;
                const currentScales = scaleQuestions[oldQId];
                const existingLinks = await testsService.searchScaleQuestions({ questionId: realQId }, token);
                for (const link of existingLinks) {
                    if (!currentScales.includes(link.scaleId)) {
                        await testsService.deleteScaleQuestion(link.id, token);
                    }
                }
                for (const scaleId of currentScales) {
                    if (!existingLinks.some(link => link.scaleId === scaleId)) {
                        await testsService.createScaleQuestion({ scaleId, questionId: realQId }, token);
                    }
                }
            }

            const newOptionsMap = {};
            for (const q of updatedQuestions) {
                newOptionsMap[q.id] = await testsService.searchAnswerOptions(q.id, token);
            }
            setOptionsMap(newOptionsMap);
            const newScaleQuestions = {};
            for (const q of updatedQuestions) {
                const links = await testsService.searchScaleQuestions({ questionId: q.id }, token);
                newScaleQuestions[q.id] = links.map(l => l.scaleId);
            }
            setScaleQuestions(newScaleQuestions);

            toast.success('Изменения сохранены!');
            setEditMode(false);
            setHasChanges(false);
        } catch (err) {
            toast.error('Ошибка сохранения: ' + err.message);
        }
    };

    const cancelEdit = () => {
        const fetchData = async () => {
            try {
                let questionsData = await testsService.searchQuestions(testId, token);
                questionsData.sort((a, b) => (a.position || 0) - (b.position || 0));
                setQuestions(questionsData);
                const options = {};
                for (const q of questionsData) {
                    options[q.id] = await testsService.searchAnswerOptions(q.id, token);
                }
                setOptionsMap(options);
                setEditMode(false);
                setHasChanges(false);
            } catch (err) {
                toast.error('Ошибка загрузки данных');
            }
        };
        fetchData().catch(console.error);
    };

    const addNewQuestion = () => {
        const newPosition = questions.length + 1;
        const newQuestionId = `temp-question-${Date.now()}-${Math.random()}`;

        const newQuestion = {
            id: newQuestionId,
            testId: testId,
            text: 'Новый вопрос',
            type: 'SINGLE_CHOICE',
            position: newPosition,
        };

        setQuestions(prev => [...prev, newQuestion]);

        const defaultOption = {
            id: `temp-opt-${Date.now()}-${Math.random()}`,
            questionId: newQuestionId,
            text: 'Вариант ответа',
            score: 0,
            isNew: true,
        };

        setOptionsMap(prev => ({
            ...prev,
            [newQuestionId]: [defaultOption],
        }));

        setTimeout(() => {
            const lastQuestion = document.getElementById(`question-${newQuestionId}`);
            if (lastQuestion) {
                lastQuestion.scrollIntoView({behavior: 'smooth', block: 'start'});
            }
        }, 100);
        setHasChanges(true);
    };

    const autoResizeTextarea = (element) => {
        if (!element) return;
        element.style.height = 'auto';
        element.style.height = element.scrollHeight + 'px';
    };

    const goToPage = (path) => {
        if (hasChanges && !window.confirm('Есть несохранённые изменения. Всё равно перейти?')) {
            return;
        }
        navigate(path);
    };

    if (loading) return <div className="test-loading">Загрузка вопросов...</div>;
    if (error) return <div className="test-error">Ошибка: {error}</div>;

    return (
        <div className="test-view-page">
            <header className="admin-header">
                <div className="header-left">
                    <img src={LogoBNTU} alt="Логотип БНТУ" className="logo-image"/>
                </div>
                <div className="tabs">
                    <button onClick={() => goToPage('/admin/profile?tab=tests')} className="tab">Тесты</button>
                    <button onClick={() => goToPage('/admin/profile?tab=results')} className="tab">Результаты</button>
                    <button onClick={() => goToPage('/admin/profile?tab=admins')} className="tab">Администраторы</button>
                </div>
                <div className="header-right">
                    <div className="admin-info">
                        <span className="admin-name-test-view"><AdminInfo userId={user?.id} token={token}/></span>
                        <span
                            className="admin-role-badge-test-view">{isSuperAdmin ? 'Супер-админ' : 'Администратор'}</span>
                        <button onClick={handleBack} className="back-button">Назад</button>
                    </div>
                </div>
            </header>

            <div className="test-content-container">
                <div className="test-white-card">
                    <div className="test-header-actions">
                        <h2>Редактирование теста</h2>
                        {!editMode ? (
                            <button className="edit-mode-button"
                                    onClick={() => setEditMode(true)}>Редактировать</button>
                        ) : (
                            <div className="edit-mode-buttons">
                                <button className="save-button" onClick={saveAllChanges}>Готово</button>
                                <button className="add-question-button" onClick={addNewQuestion}>Добавить вопрос
                                </button>
                                <button className="cancel-button" onClick={cancelEdit}>Отмена</button>
                            </div>
                        )}
                    </div>

                    {questions.length === 0 && <p>В этом тесте пока нет вопросов.</p>}

                    {questions.map((question, idx) => (
                        <div key={question.id} id={`question-${question.id}`} className="question-card">
                            <div className="question-header">
                                <div className="question-number">Вопрос {question.position || idx + 1}</div>
                                {editMode && (
                                    <button className="delete-question-btn" onClick={() => deleteQuestion(question.id)}>
                                        Удалить вопрос
                                    </button>
                                )}
                            </div>

                            <div className="question-text">
                                {editMode ? (
                                    <textarea
                                        ref={(el) => el && autoResizeTextarea(el)}
                                        value={question.text}
                                        onChange={(e) => {
                                            handleQuestionTextChange(question.id, e.target.value);
                                            autoResizeTextarea(e.target);
                                        }}
                                        onInput={(e) => autoResizeTextarea(e.target)}
                                        rows={1}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border-color)',
                                            fontFamily: 'inherit',
                                            fontSize: '1rem',
                                            resize: 'none',
                                            overflow: 'hidden',
                                            minHeight: '3rem'
                                        }}
                                        placeholder="Текст вопроса"
                                    />
                                ) : (
                                    <p>{question.text}</p>
                                )}
                            </div>

                            {editMode && (
                                <div className="question-type">
                                    <label>Тип ответа: </label>
                                    <select value={question.type}
                                            onChange={(e) => handleTypeChange(question.id, e.target.value)}>
                                        <option value="MULTIPLE_CHOICE">Одиночный выбор</option>
                                        <option value="CHECKBOXES">Множественный выбор</option>
                                    </select>
                                </div>
                            )}

                            {editMode && methodologyScales.length > 0 && (
                                <div className="question-scales">
                                    <label>Связать со шкалами:</label>
                                    <div className="scales-list">
                                        {methodologyScales.map(scale => (
                                            <label key={scale.id}>
                                                <input
                                                    type="checkbox"
                                                    checked={(scaleQuestions[question.id] || []).includes(scale.id)}
                                                    onChange={() => handleScaleToggle(question.id, scale.id)}
                                                />
                                                {scale.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="options-list">
                                {optionsMap[question.id]?.map(opt => (
                                    <div key={opt.id} className="option-item">
                                        {editMode ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={opt.text}
                                                    onChange={(e) => handleOptionTextChange(question.id, opt.id, e.target.value)}
                                                />
                                                <input
                                                    type="number"
                                                    value={opt.score}
                                                    onChange={(e) => handleOptionScoreChange(question.id, opt.id, parseInt(e.target.value) || 0)}
                                                    className="option-score-input"
                                                    min="0"
                                                    step="1"
                                                />
                                                <button className="delete-option-btn"
                                                        onClick={() => deleteOption(question.id, opt.id)}>
                                                    ✕
                                                </button>
                                            </>
                                        ) : (
                                            <div className="option-display">
                                                <span className="option-marker">{question.type === 'CHECKBOXES' ? '□' : '○'}</span>
                                                <span>{opt.text}</span>
                                                <span className="option-score">(вес: {opt.score})</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {editMode && (
                                    <button className="add-option-btn" onClick={() => addOption(question.id)}>
                                        + Добавить вариант
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TestView;