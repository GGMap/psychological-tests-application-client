import React, {useEffect, useState} from 'react';
import {testsService} from '../services/testsService';
import {useAuth} from '../contexts/AuthContext';
import '../css/pages/AdminResults.css';
import toast from "react-hot-toast";

const facultyPrefixMap = {
    "00000000-0000-0000-0000-000000000001": "101",
    "00000000-0000-0000-0000-000000000002": "102",
    "00000000-0000-0000-0000-000000000003": "103",
    "00000000-0000-0000-0000-000000000004": "104",
    "00000000-0000-0000-0000-000000000005": "105",
    "00000000-0000-0000-0000-000000000006": "106",
    "00000000-0000-0000-0000-000000000007": "107",
    "00000000-0000-0000-0000-000000000008": "108",
    "00000000-0000-0000-0000-000000000009": "109",
    "00000000-0000-0000-0000-000000000010": "110",
    "00000000-0000-0000-0000-000000000011": "111",
    "00000000-0000-0000-0000-000000000012": "112",
    "00000000-0000-0000-0000-000000000013": "113",
    "00000000-0000-0000-0000-000000000014": "114",
    "00000000-0000-0000-0000-000000000015": "115",
    "00000000-0000-0000-0000-000000000016": "116",
};

const AdminResults = () => {
    const { token, isSuperAdmin } = useAuth();

    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [students, setStudents] = useState([]);
    const [tests, setTests] = useState([]);
    const [faculties, setFaculties] = useState([]);

    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedTestId, setSelectedTestId] = useState('');
    const [selectedFacultyId, setSelectedFacultyId] = useState('');
    const [selectedGroupNumber, setSelectedGroupNumber] = useState('');

    const [attemptDateFrom, setAttemptDateFrom] = useState('');
    const [attemptDateTo, setAttemptDateTo] = useState('');

    const [availableGroups, setAvailableGroups] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedAttempt, setSelectedAttempt] = useState(null);
    const [scores, setScores] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [showScores, setShowScores] = useState(false);
    const [showAnswers, setShowAnswers] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportParams, setReportParams] = useState({
        testId: '', dateFrom: '', dateTo: '', facultyIds: [],
    });
    const [questionsCache, setQuestionsCache] = useState({});
    const [optionsCache, setOptionsCache] = useState({});
    const [riskInterpretations, setRiskInterpretations] = useState({});
    const [loadingRisks, setLoadingRisks] = useState(false);
    const [selectedRiskLevel, setSelectedRiskLevel] = useState('');
    const [appliedRiskLevel, setAppliedRiskLevel] = useState('');
    const [availableRiskLevels, setAvailableRiskLevels] = useState([]);
    const [allScales, setAllScales] = useState({});
    const [riskRanges, setRiskRanges] = useState([]);

    const parseDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('.');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            if (Number(day) >= 1 && Number(day) <= 31 && Number(month) >= 1 && Number(month) <= 12 && year.length === 4) {
                return `${year}-${month}-${day}T00:00:00`;
            }
        }
        return dateStr;
    };

    useEffect(() => {
        const loadFaculties = async () => {
            try {
                const data = await testsService.searchFaculties({});
                setFaculties(data);
            } catch (err) { console.error(err); }
        };
        loadFaculties();
    }, []);

    useEffect(() => {
        const loadLists = async () => {
            try {
                const [studentsData, testsData] = await Promise.all([
                    testsService.searchStudents({}, token),
                    testsService.searchAllTests({}, token),
                ]);
                setStudents(studentsData);
                setTests(testsData);
                const uniqueGroups = [...new Set(studentsData.map(s => s.groupNumber))].sort();
                setAvailableGroups(uniqueGroups);
            } catch (err) { console.error(err); }
        };
        loadLists();
    }, [token]);

    useEffect(() => {
        if (!selectedFacultyId) {
            const allGroups = [...new Set(students.map(s => s.groupNumber))].sort();
            setAvailableGroups(allGroups);
        } else {
            const prefix = facultyPrefixMap[selectedFacultyId];
            if (prefix) {
                const filteredGroups = [...new Set(students
                    .filter(s => s.groupNumber.toString().startsWith(prefix))
                    .map(s => s.groupNumber)
                )].sort();
                setAvailableGroups(filteredGroups);
            } else {
                setAvailableGroups([]);
            }
        }
        setSelectedGroupNumber('');
    }, [selectedFacultyId, students]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setHasSearched(true);
        setSelectedAttempt(null);
        setShowScores(false);
        setShowAnswers(false);
        setAppliedRiskLevel(selectedRiskLevel);

        try {
            let targetStudentIds;
            if (selectedStudentId) {
                targetStudentIds = [selectedStudentId];
            } else {
                let filteredStudents = [...students];
                if (selectedFacultyId) {
                    const prefix = facultyPrefixMap[selectedFacultyId];
                    if (prefix) {
                        filteredStudents = filteredStudents.filter(s => s.groupNumber.toString().startsWith(prefix));
                    }
                }
                if (selectedGroupNumber) {
                    filteredStudents = filteredStudents.filter(s => s.groupNumber.toString() === selectedGroupNumber.toString());
                }
                targetStudentIds = filteredStudents.map(s => s.id);
            }

            if (targetStudentIds.length === 0) {
                setAttempts([]);
                setLoading(false);
                return;
            }

            const filters = {};
            if (selectedTestId) filters.testId = selectedTestId;
            if (attemptDateFrom) filters.attemptDateFrom = parseDate(attemptDateFrom);
            if (attemptDateTo) filters.attemptDateTo = parseDate(attemptDateTo);

            const allAttempts = [];
            for (const studentId of targetStudentIds) {
                const studentFilters = { ...filters, studentId };
                const data = await testsService.searchTestAttempts(studentFilters, token);
                allAttempts.push(...data);
            }
            allAttempts.sort((a, b) => new Date(b.attemptDate) - new Date(a.attemptDate));
            setAttempts(allAttempts);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setSelectedFacultyId('');
        setSelectedGroupNumber('');
        setSelectedStudentId('');
        setSelectedTestId('');
        setAttemptDateTo('');
        setAttemptDateFrom('');
        setSelectedRiskLevel('');
        setAppliedRiskLevel('');
    };

    const getStudentFullName = (studentId) => {
        const student = students.find(s => s.id === studentId);
        return student ? `${student.sname} ${student.fname} ${student.mname || ''}`.trim() : 'Неизвестный студент';
    };

    const getTestName = (testId) => {
        const test = tests.find(t => t.id === testId);
        return test ? test.name : 'Неизвестный тест';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleString();
    };

    const getQuestionText = async (questionId) => {
        if (questionsCache[questionId]) return questionsCache[questionId];
        try {
            const q = await testsService.getQuestionById(questionId);
            const text = q.text || `Вопрос ${questionId}`;
            setQuestionsCache(prev => ({ ...prev, [questionId]: text }));
            return text;
        } catch { return `Вопрос ${questionId}`; }
    };

    const getOptionText = async (optionId) => {
        if (optionsCache[optionId]) return optionsCache[optionId];
        try {
            const opt = await testsService.getAnswerOptionById(optionId);
            const text = opt.text || `Вариант ${optionId}`;
            setOptionsCache(prev => ({ ...prev, [optionId]: text }));
            return text;
        } catch { return `Вариант ${optionId}`; }
    };

    const handleViewScores = async (attempt) => {
        setSelectedAttempt(attempt);
        setShowScores(true);
        setShowAnswers(false);
        setLoadingDetails(true);
        try {
            const scoresData = await testsService.getTestScores(attempt.id, token);
            const scoresWithScales = await Promise.all(scoresData.map(async (s) => {
                try {
                    const scale = await testsService.getScaleById(s.scaleId);
                    return { ...s, scaleName: scale.name };
                } catch { return { ...s, scaleName: 'Шкала' }; }
            }));
            setScores(scoresWithScales);
        } catch (err) {
            console.error(err);
            setScores([]);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleViewAnswers = async () => {
        if (!selectedAttempt) return;
        setShowAnswers(true);
        setLoadingDetails(true);
        try {
            const answersData = await testsService.searchStudentAnswers(selectedAttempt.id, token);
            const answersWithText = await Promise.all(answersData.map(async (ans) => ({
                ...ans,
                questionText: await getQuestionText(ans.questionId),
                optionText: await getOptionText(ans.answerOptionId),
            })));
            setAnswers(answersWithText);
        } catch (err) {
            console.error(err);
            toast.error('Не удалось загрузить ответы');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleDeleteAttempt = async (attemptId) => {
        if (!window.confirm('Удалить попытку прохождения?')) return;
        try {
            await testsService.deleteTestAttempt(attemptId, token);
            setAttempts(prev => prev.filter(a => a.id !== attemptId));
            toast.success('Попытка удалена');
        } catch (err) {
            toast.error('Ошибка удаления попытки: ' + err.message);
        }
    };

    const handleGenerateReport = async () => {
        if (!reportParams.testId) {
            toast.error('Выберите тест');
            return;
        }
        try {
            const params = { testId: reportParams.testId };
            if (reportParams.dateFrom) params.dateFrom = reportParams.dateFrom + 'T00:00:00';
            if (reportParams.dateTo) params.dateTo = reportParams.dateTo + 'T23:59:59';
            if (reportParams.facultyIds && reportParams.facultyIds.length) params.facultyIds = reportParams.facultyIds;
            const response = await testsService.generateReport(params, token);
            const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${reportParams.testId}_${new Date().toISOString()}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setShowReportModal(false);
        } catch (err) {
            toast.error('Ошибка формирования отчёта: ' + err.message);
        }
    };

    useEffect(() => {
        const loadAllScales = async () => {
            try {
                const data = await testsService.searchScales({}, token);
                const map = {};
                data.forEach(scale => { map[scale.id] = { isTotal: scale.isTotal, name: scale.name }; });
                setAllScales(map);
            } catch (err) { console.error(err); }
        };
        loadAllScales();
    }, [token]);

    useEffect(() => {
        const loadTotalScalesRanges = async () => {
            try {

                const scales = await testsService.searchScales({}, token);
                const totalScales = scales.filter(s => s.isTotal === true);
                const interpretationsSet = new Set();
                for (const scale of totalScales) {
                    const ranges = await testsService.searchScoreRanges({ scaleId: scale.id }, token);
                    ranges.forEach(range => {
                        if (range.interpretation) interpretationsSet.add(range.interpretation);
                    });
                }
                const levels = [...Array.from(interpretationsSet).sort()];
                setAvailableRiskLevels(levels);
            } catch (err) {
                console.error('Ошибка загрузки уровней риска', err);
            }
        };
        if (token) loadTotalScalesRanges();
    }, [token]);

    // Функция загрузки интерпретаций риска для всех попыток
    const loadRiskInterpretations = async (attemptsList) => {
        if (!attemptsList.length) return;
        setLoadingRisks(true);
        const interpretationsMap = {};
        for (const attempt of attemptsList) {
            try {
                const scores = await testsService.getTestScores(attempt.id, token);

                const totalScores = scores.filter(score => score.interpretation);
                interpretationsMap[attempt.id] = totalScores.map(score => score.interpretation);
            } catch (err) {
                //console.error(`Не удалось загрузить риски для попытки ${attempt.id}`, err);
                interpretationsMap[attempt.id] = [];
            }
        }
        setRiskInterpretations(interpretationsMap);
        setLoadingRisks(false);
    };

    useEffect(() => {
        if (attempts.length > 0 && !loadingRisks && Object.keys(allScales).length > 0) {
            loadRiskInterpretations(attempts);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attempts, allScales]);

    const filteredAttempts = !appliedRiskLevel
        ? attempts
        : attempts.filter(attempt => {
            const interps = riskInterpretations[attempt.id] || [];
            return interps.includes(appliedRiskLevel);
        });

    useEffect(() => {
        const loadScalesAndRanges = async () => {
            try {
                const scales = await testsService.searchScales({}, token);
                const map = {};
                const totalScales = [];
                scales.forEach(scale => {
                    map[scale.id] = { isTotal: scale.isTotal, methodologyId: scale.methodologyId, name: scale.name };
                    if (scale.isTotal) totalScales.push(scale);
                });
                setAllScales(map);
                const allRanges = [];
                for (const scale of totalScales) {
                    const ranges = await testsService.searchScoreRanges({ scaleId: scale.id }, token);
                    ranges.forEach(r => {
                        allRanges.push({ ...r, methodologyId: scale.methodologyId, scaleName: scale.name });
                    });
                }
                setRiskRanges(allRanges);
            } catch (err) { console.error(err); }
        };
        if (token) loadScalesAndRanges();
    }, [token]);

    const getAvailableRiskLevels = (testId) => {
        if (!testId) {
            return [...new Set(riskRanges.map(r => r.interpretation))].sort();
        }
        const test = tests.find(t => t.id === testId);
        if (!test) return [];
        const methodologyId = test.methodologyId;
        const filtered = riskRanges.filter(r => r.methodologyId === methodologyId);
        return [...new Set(filtered.map(r => r.interpretation))].sort();
    };

    useEffect(() => {
        const levels = getAvailableRiskLevels(selectedTestId);
        setAvailableRiskLevels(levels);
        setSelectedRiskLevel('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTestId, riskRanges, tests]);

    return (
        <div className="admin-results-container">
            <div className="admin-results-header">
                <h2>Результаты прохождения тестов</h2>
                {isSuperAdmin && (
                    <button onClick={() => setShowReportModal(true)} className="report-btn">Скачать отчёт</button>
                )}
            </div>
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
                            {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="admin-results-form-row">
                    <div className="admin-results-form-group">
                        <label>Факультет</label>
                        <select value={selectedFacultyId} onChange={(e) => setSelectedFacultyId(e.target.value)}>
                            <option value="">Любой факультет</option>
                            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    <div className="admin-results-form-group">
                        <label>Группа</label>
                        <select value={selectedGroupNumber} onChange={(e) => setSelectedGroupNumber(e.target.value)}>
                            <option value="">Любая группа</option>
                            {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                </div>
                <div className="admin-results-form-row">
                    <div className="admin-results-form-group">
                        <label>Дата от</label>
                        <input type="text" value={attemptDateFrom} onChange={(e) => setAttemptDateFrom(e.target.value)} placeholder="01.01.2026" />
                    </div>
                    <div className="admin-results-form-group">
                        <label>Дата до</label>
                        <input type="text" value={attemptDateTo} onChange={(e) => setAttemptDateTo(e.target.value)} placeholder="31.12.2026" />
                    </div>
                </div>

                <div className="admin-results-form-row">
                    <div className="admin-results-form-group">
                        <label>Степень риска</label>
                        <select value={selectedRiskLevel} onChange={(e) => setSelectedRiskLevel(e.target.value)}>
                            <option value="">Любая степень</option>
                            {availableRiskLevels.map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="admin-results-buttons">
                    <button type="submit" disabled={loading} className="admin-results-search-btn">Поиск попыток</button>
                    <button type="button" onClick={resetFilters} className="admin-results-reset-btn">Сбросить фильтры</button>
                    <div className="admin-results-count">Найдено записей: {filteredAttempts.length}</div>
                </div>
            </form>

            {error && <div className="admin-results-error">{error}</div>}
            {loading && <div className="admin-results-loading">Загрузка...</div>}

            {hasSearched && !loading && attempts.length === 0 && <p>Ни одной попытки не найдено.</p>}

            {filteredAttempts.length > 0 && (
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
                    {filteredAttempts.map(attempt => (
                        <tr key={attempt.id}>
                            <td>{getStudentFullName(attempt.studentId)}</td>
                            <td>{getTestName(attempt.testId)}</td>
                            <td>{formatDate(attempt.attemptDate)}</td>
                            <td className="admin-results-actions">
                                <button onClick={() => handleViewScores(attempt)} className="admin-results-details-btn">Результаты</button>
                                {isSuperAdmin && (
                                    <button onClick={() => handleDeleteAttempt(attempt.id)} className="admin-results-delete-btn">Удалить</button>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {selectedAttempt && showScores && (
                <div className="admin-results-attempt-details">
                    <h3>Детали попытки</h3>
                    <p><strong>Студент:</strong> {getStudentFullName(selectedAttempt.studentId)}</p>
                    <p><strong>Тест:</strong> {getTestName(selectedAttempt.testId)}</p>
                    <p><strong>Дата:</strong> {formatDate(selectedAttempt.attemptDate)}</p>

                    <h4>Результаты по шкалам</h4>
                    {loadingDetails ? (
                        <p>Загрузка...</p>
                    ) : scores.length === 0 ? (
                        <p>Нет результатов</p>
                    ) : (
                        <div className="admin-results-scores-list">
                            {scores.map(score => (
                                <div key={score.id} className="admin-results-score-card">
                                    <div className="admin-results-scale-name">{score.scaleName}</div>
                                    <div className="admin-results-score-value">Балл: {score.score ?? score.value ?? 0}</div>
                                    <div className="admin-results-score-interpretation">{score.interpretation || 'Нет интерпретации'}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!showAnswers ? (
                        <button onClick={handleViewAnswers} className="admin-results-details-btn">Подробнее</button>
                    ) : (
                        <>
                            <h4>Ответы на вопросы</h4>
                            {loadingDetails ? (
                                <p>Загрузка...</p>
                            ) : answers.length === 0 ? (
                                <p>Нет ответов</p>
                            ) : (
                                <div className="admin-results-answers-list">
                                    {answers.map(ans => (
                                        <div key={ans.id} className="admin-results-answer-item">
                                            <div className="admin-results-question-text">{ans.questionText}</div>
                                            <div className="admin-results-option-text">Выбранный вариант: {ans.optionText}</div>
                                        </div>
                                    ))}

                                </div>)}
                                <button onClick={() => { setShowAnswers(false); }} className="admin-results-collapse-btn">Свернуть</button>
                        </>

                    )}
                    <button onClick={() => { setShowScores(false); setShowAnswers(false); setSelectedAttempt(null); }} className="admin-results-close-details-btn">Закрыть</button>
                </div>
            )}

            {showReportModal && (
                <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
                    <div className="modal-content report-modal" onClick={e => e.stopPropagation()}>
                        <h3>Параметры отчёта</h3>
                        <div className="form-group">
                            <label>Тест</label>
                            <select value={reportParams.testId} onChange={e => setReportParams({...reportParams, testId: e.target.value})}>
                                <option value="">Выберите тест</option>
                                {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Дата от</label>
                                <input type="date" value={reportParams.dateFrom} onChange={e => setReportParams({...reportParams, dateFrom: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Дата до</label>
                                <input type="date" value={reportParams.dateTo} onChange={e => setReportParams({...reportParams, dateTo: e.target.value})} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Факультеты</label>
                            <select multiple value={reportParams.facultyIds} onChange={e => setReportParams({...reportParams, facultyIds: Array.from(e.target.selectedOptions, o => o.value)})}>
                                {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <small>Удерживайте Ctrl для выбора нескольких</small>
                        </div>
                        <div className="modal-buttons">
                            <button onClick={() => setShowReportModal(false)}>Отмена</button>
                            <button onClick={handleGenerateReport}>Скачать</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminResults;