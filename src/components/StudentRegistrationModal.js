import React, { useState, useEffect } from 'react';
import { testsService } from '../services/testsService';
import '../css/components/StudentRegistrationModal.css';

const facultyPrefixMap = {
    "00000000-0000-0000-0000-000000000001": "101", // АТФ
    "00000000-0000-0000-0000-000000000002": "102", // ФГДЭ
    "00000000-0000-0000-0000-000000000003": "103", // МСФ
    "00000000-0000-0000-0000-000000000004": "104", // МТФ
    "00000000-0000-0000-0000-000000000005": "105", // ФММП
    "00000000-0000-0000-0000-000000000006": "106", // ЭФ
    "00000000-0000-0000-0000-000000000007": "107", // ФИТР
    "00000000-0000-0000-0000-000000000008": "108", // ФТУГ
    "00000000-0000-0000-0000-000000000009": "109", // ИПФ
    "00000000-0000-0000-0000-000000000010": "110", // ФЭС
    "00000000-0000-0000-0000-000000000011": "111", // АФ
    "00000000-0000-0000-0000-000000000012": "112", // СФ
    "00000000-0000-0000-0000-000000000013": "113", // ПСФ
    "00000000-0000-0000-0000-000000000014": "114", // ФТК
    "00000000-0000-0000-0000-000000000015": "115", // ВТФ
    "00000000-0000-0000-0000-000000000016": "116", // СТФ
};

const StudentRegistrationModal = ({ isOpen, onClose, testId, onSuccess }) => {
    const [formData, setFormData] = useState({
        sname: '',
        fname: '',
        mname: '',
        facultyId: '',
        groupNumber: '',
        gender: 'MALE',
        age: '',
        residence: 'Общежитие',
    });
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastPrefix, setLastPrefix] = useState('');
    const [groupSuffix, setGroupSuffix] = useState('');

    // Загрузка факультетов при открытии
    useEffect(() => {
        if (isOpen) {
            const fetchFaculties = async () => {
                try {
                    const data = await testsService.searchFaculties({});
                    setFaculties(data);
                } catch (err) {
                    setError('Не удалось загрузить список факультетов');
                }
            };
            fetchFaculties();
            // Сброс формы
            setFormData({
                sname: '', fname: '', mname: '', facultyId: '', groupNumber: '', gender: 'MALE', age: '', residence: 'Общежитие'
            });
            setError('');
            setGroupSuffix('');
            setLastPrefix('');
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFacultyChange = (facultyId) => {
        const prefix = facultyPrefixMap[facultyId] || '';
        if (prefix) {
            setFormData(prev => ({ ...prev, groupNumber: prefix + groupSuffix }));
            setLastPrefix(prefix);
        }
        setFormData(prev => ({ ...prev, facultyId }));
    };

    const handleGroupSuffixChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 5) val = val.slice(0,5);
        setGroupSuffix(val);
        setFormData(prev => ({ ...prev, groupNumber: lastPrefix + val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!formData.residence || formData.residence.trim() === '') {
                throw new Error('Укажите место проживания');
            }
            const trimmedData = {
                ...formData,
                sname: formData.sname.trim(),
                fname: formData.fname.trim(),
                mname: formData.mname ? formData.mname.trim() : '',
            };
            const student = await testsService.createStudent({
                ...trimmedData,
                groupNumber: parseInt(formData.groupNumber, 10),
                age: parseInt(formData.age, 10),
            });
            if (onSuccess) onSuccess(student.id);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content registration-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Регистрация для прохождения теста</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    {error && <div className="modal-error">{error}</div>}
                    <div className="form-row-registration-modal">
                        <div className="form-group-methodology">
                            <label>Фамилия</label>
                            <input type="text" name="sname" value={formData.sname} onChange={handleChange} required />
                        </div>
                        <div className="form-group-methodology">
                            <label>Имя</label>
                            <input type="text" name="fname" value={formData.fname} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="form-group-methodology">
                        <label>Отчество</label>
                        <input type="text" name="mname" value={formData.mname} onChange={handleChange} />
                    </div>
                    <div className="form-group-methodology">
                        <label>Факультет</label>
                        <select name="facultyId" value={formData.facultyId} onChange={(e) => handleFacultyChange(e.target.value)} required>
                            <option value="">Выберите факультет</option>
                            {faculties.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row-registration-modal">
                        <div className="form-group-methodology">
                            <label>Группа</label>
                            <div className="group-container">
                                <input
                                    type="text"
                                    value={lastPrefix}
                                    readOnly
                                    disabled
                                    className="group-prefix-input"
                                />
                                <input
                                    type="text"
                                    value={groupSuffix}
                                    onChange={handleGroupSuffixChange}
                                    required
                                    inputMode="numeric"
                                    pattern="\d*"
                                    maxLength="5"
                                    placeholder="01122"
                                    className="group-suffix-input"
                                />
                            </div>
                        </div>
                        <div className="form-group-methodology">
                            <label>Возраст</label>
                            <input type="number" name="age" value={formData.age} onChange={handleChange} required min="16" max="100" />
                        </div>
                    </div>
                    <div className="form-row-registration-modal">
                        <div className="form-group-methodology">
                            <label>Пол</label>
                            <select name="gender" value={formData.gender} onChange={handleChange}>
                                <option value="MALE">Мужской</option>
                                <option value="FEMALE">Женский</option>
                            </select>
                        </div>
                        <div className="form-group-methodology">
                            <label>Проживание</label>
                            <select name="residence" value={formData.residence} onChange={handleChange} required>
                                <option value="Общежитие">Общежитие</option>
                                <option value="С родителями">С родителями</option>
                                <option value="Съёмное жильё">Съёмное жильё</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-buttons">
                        <button type="button" onClick={onClose} className="cancel-btn">Отмена</button>
                        <button type="submit" disabled={loading} className="submit-btn">
                            {loading ? 'Регистрация...' : 'Начать тест'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentRegistrationModal;