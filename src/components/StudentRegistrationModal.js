import React, { useState, useEffect } from 'react';
import { testsService } from '../services/testsService';
import '../css/components/StudentRegistrationModal.css';

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
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!formData.residence || formData.residence.trim() === '') {
                throw new Error('Укажите место проживания');
            }
            const student = await testsService.createStudent({
                ...formData,
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
                        <div className="form-group">
                            <label>Фамилия</label>
                            <input type="text" name="sname" value={formData.sname} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Имя</label>
                            <input type="text" name="fname" value={formData.fname} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Отчество</label>
                        <input type="text" name="mname" value={formData.mname} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Факультет</label>
                        <select name="facultyId" value={formData.facultyId} onChange={handleChange} required>
                            <option value="">Выберите факультет</option>
                            {faculties.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row-registration-modal">
                        <div className="form-group">
                            <label>Группа</label>
                            <input
                                type="text"
                                name="groupNumber"
                                value={formData.groupNumber}
                                onChange={handleChange}
                                required
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength="8"
                                placeholder="10701122"
                            />
                        </div>
                        <div className="form-group">
                            <label>Возраст</label>
                            <input type="number" name="age" value={formData.age} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="form-row-registration-modal">
                        <div className="form-group">
                            <label>Пол</label>
                            <select name="gender" value={formData.gender} onChange={handleChange}>
                                <option value="MALE">Мужской</option>
                                <option value="FEMALE">Женский</option>
                            </select>
                        </div>
                        <div className="form-group">
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