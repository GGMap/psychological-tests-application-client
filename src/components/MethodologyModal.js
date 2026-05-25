import {useEffect, useState} from "react";
import toast from "react-hot-toast";

const MethodologyModal = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setDescription('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!name.trim()) {
            toast.error('Введите название методики');
            return;
        }
        onCreate({ name: name.trim(), description });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>Новая методика</h3>
                <div className="form-group-methodology">
                    <label>Название</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group-methodology">
                    <label>Описание</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows="2" />
                </div>
                <div className="modal-buttons">
                    <button onClick={onClose}>Отмена</button>
                    <button onClick={handleSubmit}>Создать</button>
                </div>
            </div>
        </div>
    );
};

export default MethodologyModal;