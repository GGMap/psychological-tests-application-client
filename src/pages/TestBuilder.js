import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { testsService } from '../services/testsService';
import LogoBNTU from '../logo/Logo_BNTU.png';
import '../css/pages/TestBuilder.css';
import AdminInfo from "../contexts/AdminInfo";
import MethodologyModal from "../components/MethodologyModal";
import toast from "react-hot-toast";

const TestBuilder = () => {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);

    // Основные данные теста
    const [test, setTest] = useState({ name: '', methodologyId: '' });
    const [methodologies, setMethodologies] = useState([]);

    // Для создания новой методики
    const [showMethodologyModal, setShowMethodologyModal] = useState(false);

    // Шкалы и диапазоны
    const [scales, setScales] = useState([]);
    const [ranges, setRanges] = useState({});
    const [editingScale, setEditingScale] = useState(null);
    const [editingRange, setEditingRange] = useState(null);

    // Вопросы, варианты и связи
    const [questions, setQuestions] = useState([]);
    const [optionsMap, setOptionsMap] = useState({});
    const [scaleQuestions, setScaleQuestions] = useState({});
    const [allScales, setAllScales] = useState([]);

    // Загрузка методик
    useEffect(() => {
        const load = async () => {
            const data = await testsService.searchMethodologies({}, token);
            setMethodologies(data);
        };
        load();
    }, [token]);

    // При выборе методики загружаем её шкалы
    useEffect(() => {
        if (!test.methodologyId) {
            setScales([]);
            setRanges({});
            setAllScales([]);
            return;
        }
        const loadScales = async () => {
            const scalesData = await testsService.searchScales({ methodologyId: test.methodologyId }, token);
            setScales(scalesData);
            setAllScales(scalesData);
            const rangesMap = {};
            for (const scale of scalesData) {
                const rangesData = await testsService.searchScoreRanges({ scaleId: scale.id }, token);
                rangesMap[scale.id] = rangesData;
            }
            setRanges(rangesMap);
        };
        loadScales();
    }, [test.methodologyId, token]);

    // Создание новой методики
    const handleCreateMethodology = async ({ name, description }) => {
        try {
            const newMethod = await testsService.createMethodology({ name, description }, token);
            setMethodologies(prev => [...prev, newMethod]);
            setTest(prev => ({ ...prev, methodologyId: newMethod.id }));
            setHasChanges(true);
        } catch (err) {
            toast.error('Ошибка создания методики: ' + err.message);
        }
    }

    //  Управление шкалами
    const handleAddScale = () => {
        setEditingScale({ methodologyId: test.methodologyId, name: '', isTotal: false, description: '' });
    };
    const handleEditScale = (scale) => setEditingScale(scale);
    const handleSaveScale = async (scaleData) => {
        try {
            let saved;
            if (scaleData.id) {
                await testsService.updateScale(scaleData.id, scaleData, token);
                saved = scaleData;
            } else {
                saved = await testsService.createScale(scaleData, token);
            }
            if (scaleData.id) {
                setScales(prev => prev.map(s => s.id === saved.id ? saved : s));
            } else {
                setScales(prev => [...prev, saved]);
                setAllScales(prev => [...prev, saved]);
            }
            setHasChanges(true);
        } catch (err) {
            toast.error('Ошибка сохранения шкалы: ' + err.message);
        }
        setEditingScale(null);
    };
    const handleDeleteScale = async (scaleId) => {
        if (!window.confirm('Удалить шкалу? Это удалит все её диапазоны и связи с вопросами.')) return;
        try {
            await testsService.deleteScale(scaleId, token);
            setScales(prev => prev.filter(s => s.id !== scaleId));
            setAllScales(prev => prev.filter(s => s.id !== scaleId));
            setRanges(prev => {
                const newRanges = { ...prev };
                delete newRanges[scaleId];
                return newRanges;
            });
            setHasChanges(true);
        } catch (err) {
            toast.error('Ошибка удаления шкалы: ' + err.message);
        }
    };

    // Управление диапазонами
    const handleAddRange = (scaleId) => setEditingRange({ scaleId, minScore: 0, maxScore: 0, interpretation: '', description: '' });
    const handleEditRange = (range) => setEditingRange(range);
    const handleSaveRange = async (rangeData) => {
        try {
            let saved;
            if (rangeData.id) {
                await testsService.updateScoreRange(rangeData.id, rangeData, token);
                saved = rangeData;
            } else {
                saved = await testsService.createScoreRange(rangeData, token);
            }
            setRanges(prev => ({
                ...prev,
                [rangeData.scaleId]: prev[rangeData.scaleId]?.map(r => r.id === saved.id ? saved : r) || [saved]
            }));
            setHasChanges(true);
        } catch (err) {
            toast.error('Ошибка сохранения диапазона: ' + err.message);
        }
        setEditingRange(null);
    };
    const handleDeleteRange = async (rangeId, scaleId) => {
        if (!window.confirm('Удалить диапазон?')) return;
        try {
            await testsService.deleteScoreRange(rangeId, token);
            setRanges(prev => ({
                ...prev,
                [scaleId]: prev[scaleId].filter(r => r.id !== rangeId)
            }));
            setHasChanges(true);
        } catch (err) {
            toast.error('Ошибка удаления диапазона: ' + err.message);
        }
    };

    // Управление вопросами
    const handleAddQuestion = () => {
        const newPosition = questions.length + 1;
        const newId = `temp-question-${Date.now()}`;
        const newQuestion = {
            id: newId,
            testId: test.id || '',
            text: 'Новый вопрос',
            type: 'SINGLE_CHOICE',
            position: newPosition,
        };
        setQuestions(prev => [...prev, newQuestion]);
        setOptionsMap(prev => ({ ...prev, [newId]: [] }));
        setScaleQuestions(prev => ({ ...prev, [newId]: [] }));
        setHasChanges(true);
    };
    const handleQuestionTextChange = (qId, text) => {
        setQuestions(prev => prev.map(q => q.id === qId ? { ...q, text } : q));
        setHasChanges(true);
    };
    const handleQuestionTypeChange = (qId, type) => {
        setQuestions(prev => prev.map(q => q.id === qId ? { ...q, type } : q));
        setHasChanges(true);
    };
    const handleAddOption = (qId) => {
        const newOption = {
            id: `temp-opt-${Date.now()}`,
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
    const handleOptionChange = (qId, optId, field, value) => {
        setOptionsMap(prev => ({
            ...prev,
            [qId]: prev[qId].map(opt => opt.id === optId ? { ...opt, [field]: value } : opt)
        }));
        setHasChanges(true);
    };
    const handleDeleteOption = async (qId, optId) => {
        const option = optionsMap[qId]?.find(o => o.id === optId);
        if (option && !option.isNew) {
            try {
                await testsService.deleteAnswerOption(optId, token);
            } catch (err) {
                toast.error('Ошибка удаления варианта: ' + err.message);
                return;
            }
        }
        setOptionsMap(prev => ({
            ...prev,
            [qId]: prev[qId].filter(o => o.id !== optId)
        }));
        setHasChanges(true);
    };
    const handleDeleteQuestion = async (qId) => {
        if (!window.confirm('Удалить вопрос и все его варианты?')) return;
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

    // Управление связями вопрос-шкала
    const handleToggleScaleForQuestion = (qId, scaleId) => {
        const current = scaleQuestions[qId] || [];
        const newScales = current.includes(scaleId)
            ? current.filter(s => s !== scaleId)
            : [...current, scaleId];
        setScaleQuestions(prev => ({ ...prev, [qId]: newScales }));
        setHasChanges(true);
    };

    //  Сохранение теста
    const saveAll = async () => {
        setSaving(true);
        try {
            let testId = test.id;
            if (testId) {
                await testsService.updateTest(testId, { name: test.name, methodologyId: test.methodologyId }, token);
            } else {
                const newTest = await testsService.createTest({ name: test.name, methodologyId: test.methodologyId }, token);
                testId = newTest.id;
                setTest(prev => ({ ...prev, id: testId }));
            }

            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const isTemp = q.id.startsWith('temp-question');
                let realQId = q.id;
                if (isTemp) {
                    const created = await testsService.createQuestion({
                        testId,
                        text: q.text,
                        type: q.type === 'MULTIPLE_CHOICE' ? 0 : 1,
                        position: i + 1,
                    }, token);
                    realQId = created.id;
                    setQuestions(prev => prev.map(qq => qq.id === q.id ? { ...qq, id: realQId } : qq));
                    setOptionsMap(prev => {
                        const newMap = { ...prev, [realQId]: prev[q.id] };
                        delete newMap[q.id];
                        return newMap;
                    });
                    setScaleQuestions(prev => {
                        const newMap = { ...prev, [realQId]: prev[q.id] };
                        delete newMap[q.id];
                        return newMap;
                    });
                } else {
                    await testsService.updateQuestion(realQId, {
                        testId,
                        text: q.text,
                        type: q.type === 'MULTIPLE_CHOICE' ? 0 : 1,
                        position: i + 1,
                    }, token);
                }
            }

            for (const qId of Object.keys(optionsMap)) {
                const realQId = qId.startsWith('temp-question') ? questions.find(q => q.id === qId)?.id : qId;
                if (!realQId) continue;
                for (const opt of optionsMap[qId]) {
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

            for (const qId of Object.keys(scaleQuestions)) {
                const realQId = qId.startsWith('temp-question') ? questions.find(q => q.id === qId)?.id : qId;
                if (!realQId) continue;
                const existing = await testsService.searchScaleQuestions({ questionId: realQId }, token);
                for (const rel of existing) {
                    await testsService.deleteScaleQuestion(rel.id, token);
                }
                for (const scaleId of scaleQuestions[qId]) {
                    await testsService.createScaleQuestion({ scaleId, questionId: realQId }, token);
                }
            }

            toast.success('Тест успешно сохранён!');
            setHasChanges(false);
        } catch (err) {
            toast.error('Ошибка сохранения: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Предупреждение о несохранённых изменениях
    useEffect(() => {
        const unloadHandler = (e) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = 'Вы не сохранили изменения. Покинуть страницу?';
                return e.returnValue;
            }
        };
        window.addEventListener('beforeunload', unloadHandler);
        return () => window.removeEventListener('beforeunload', unloadHandler);
    }, [hasChanges]);

    const goToPage = (path) => {
        if (hasChanges && !window.confirm('Есть несохранённые изменения. Всё равно перейти?')) return;
        navigate(path);
    };

    // Модальные окна для шкал и диапазонов
    const ScaleModal = ({ scale, onClose, onSave }) => {
        const [data, setData] = useState(scale || { methodologyId: test.methodologyId, name: '', isTotal: false, description: '' });
        return (
            <div className="modal-overlay">
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <h3>{scale ? 'Редактировать шкалу' : 'Новая шкала'}</h3>
                    <div className="form-group-methodology"><label>Название</label><input value={data.name} onChange={e => setData({...data, name: e.target.value})} /></div>
                    <div className="form-group-methodology"><label>Описание</label><textarea value={data.description} onChange={e => setData({...data, description: e.target.value})} /></div>
                    <div className="form-group-methodology"><label>Итоговая шкала</label><input type="checkbox" checked={data.isTotal} onChange={e => setData({...data, isTotal: e.target.checked})} /> </div>
                    <div className="modal-buttons"><button onClick={onClose}>Отмена</button><button onClick={() => onSave(data)}>Сохранить</button></div>
                </div>
            </div>
        );
    };
    const RangeModal = ({ range, onClose, onSave }) => {
        const [data, setData] = useState(range || { scaleId: '', minScore: 0, maxScore: 0, interpretation: '', description: '' });
        return (
            <div className="modal-overlay">
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <h3>{range ? 'Редактировать диапазон' : 'Новый диапазон'}</h3>
                    <div className="form-group-methodology"><label>Мин. балл</label><input type="number" value={data.minScore} onChange={e => setData({...data, minScore: parseInt(e.target.value)})} /></div>
                    <div className="form-group-methodology"><label>Макс. балл</label><input type="number" value={data.maxScore} onChange={e => setData({...data, maxScore: parseInt(e.target.value)})} /></div>
                    <div className="form-group-methodology"><label>Интерпретация</label><input value={data.interpretation} onChange={e => setData({...data, interpretation: e.target.value})} /></div>
                    <div className="form-group-methodology"><label>Описание</label><textarea value={data.description} onChange={e => setData({...data, description: e.target.value})} /></div>
                    <div className="modal-buttons"><button onClick={onClose}>Отмена</button><button onClick={() => onSave(data)}>Сохранить</button></div>
                </div>
            </div>
        );
    };

    return (
        <div className="test-builder-page">
            <header className="admin-header">
                <div className="header-left"><img src={LogoBNTU} alt="Логотип БНТУ" className="logo-image" /></div>
                <div className="tabs">
                    <button onClick={() => goToPage('/admin/profile?tab=tests')} className="tab">Тесты</button>
                    <button onClick={() => goToPage('/admin/profile?tab=results')} className="tab">Результаты</button>
                    <button onClick={() => goToPage('/admin/profile?tab=admins')} className="tab">Администраторы</button>
                </div>
                <div className="header-right">
                    <div className="admin-info">
                        <span className="admin-name"><AdminInfo userId={user?.id} token={token}/></span>
                        <span className="admin-role-badge">Супер-админ</span>
                    </div>
                </div>
            </header>

            <div className="builder-content">
                <div className="builder-white-card">
                    <h2>Конструктор теста</h2>
                    <div className="builder-test-info">
                        <div className="form-group-methodology">
                            <label>Методика</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select value={test.methodologyId} onChange={e => { setTest({...test, methodologyId: e.target.value}); setHasChanges(true); }} style={{ flex: 1 }}>
                                    <option value="">Выберите методику</option>
                                    {methodologies.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <button type="button" onClick={() => setShowMethodologyModal(true)} className="small-btn">Новая методика</button>
                            </div>
                        </div>
                        <div className="form-group-methodology"><label>Название теста</label><input type="text" value={test.name} onChange={e => { setTest({...test, name: e.target.value}); setHasChanges(true); }} /></div>
                    </div>

                    {/* Шкалы и диапазоны */}
                    <div className="builder-section">
                        <div className="section-header"><h3>Шкалы</h3><button onClick={handleAddScale}>+ Добавить шкалу</button></div>
                        {scales.map(scale => (
                            <div key={scale.id} className="scale-card">
                                <div className="scale-header">
                                    <strong>{scale.name}</strong> {scale.isTotal && <span className="badge">Итоговая</span>}
                                    <button onClick={() => handleEditScale(scale)} className="icon-button">Редактировать</button>
                                    <button onClick={() => handleDeleteScale(scale.id)} className="icon-button delete">Удалить</button>
                                </div>
                                <div className="scale-description">{scale.description}</div>
                                <div className="ranges-list">
                                    <div className="section-header small"><h4>Диапазоны</h4><button onClick={() => handleAddRange(scale.id)}>+ Добавить</button></div>
                                    {(ranges[scale.id] || []).map(r => (
                                        <div key={r.id} className="range-item">
                                            <span>{r.minScore}–{r.maxScore}: {r.interpretation}</span>
                                            <button onClick={() => handleEditRange(r)}>Редактировать</button>
                                            <button onClick={() => handleDeleteRange(r.id, scale.id)} className="delete">Удалить</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Вопросы */}
                    <div className="builder-section">
                        <div className="section-header"><h3>Вопросы</h3><button onClick={handleAddQuestion}>+ Добавить вопрос</button></div>
                        {questions.map((q, idx) => (
                            <div key={q.id} className="question-card">
                                <div className="question-header">
                                    <strong>Вопрос {idx+1}</strong>
                                    <button onClick={() => handleDeleteQuestion(q.id)} className="delete">Удалить вопрос</button>
                                </div>
                                <div className="question-text"><textarea value={q.text} onChange={e => handleQuestionTextChange(q.id, e.target.value)} rows="2" /></div>
                                <div className="question-type"><label>Тип</label><select value={q.type} onChange={e => handleQuestionTypeChange(q.id, e.target.value)}><option value="SINGLE_CHOICE">Одиночный выбор</option><option value="MULTIPLE_CHOICE">Множественный выбор</option></select></div>
                                <div className="options-list">
                                    {optionsMap[q.id]?.map(opt => (
                                        <div key={opt.id} className="option-item">
                                            <input value={opt.text} onChange={e => handleOptionChange(q.id, opt.id, 'text', e.target.value)} />
                                            <input type="number" value={opt.score} onChange={e => handleOptionChange(q.id, opt.id, 'score', parseInt(e.target.value))} className="option-score" />
                                            <button onClick={() => handleDeleteOption(q.id, opt.id)} className="delete">Удалить</button>
                                        </div>
                                    ))}
                                    <button onClick={() => handleAddOption(q.id)}>+ Добавить вариант</button>
                                </div>
                                <div className="scale-links"><label>Связать со шкалами:</label>{allScales.map(scale => (<label key={scale.id}><input type="checkbox" checked={(scaleQuestions[q.id] || []).includes(scale.id)} onChange={() => handleToggleScaleForQuestion(q.id, scale.id)} /> {scale.name}</label>))}</div>
                            </div>
                        ))}
                    </div>

                    <div className="builder-actions"><button onClick={saveAll} disabled={saving} className="save-button">{saving ? 'Сохранение...' : 'Сохранить тест'}</button></div>
                </div>
            </div>

            {showMethodologyModal && <MethodologyModal />}
            {editingScale && <ScaleModal scale={editingScale} onClose={() => setEditingScale(null)} onSave={handleSaveScale} />}
            {editingRange && <RangeModal range={editingRange} onClose={() => setEditingRange(null)} onSave={handleSaveRange} />}

            <MethodologyModal
                isOpen={showMethodologyModal}
                onClose={() => setShowMethodologyModal(false)}
                onCreate={handleCreateMethodology}
            />
        </div>
    );
};

export default TestBuilder;