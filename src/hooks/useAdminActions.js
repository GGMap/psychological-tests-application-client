import { useState } from 'react';
import { adminService } from '../services/adminService';

export const useAdminActions = (token, onSuccess) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Активация администратора
    const activateAdmin = async (adminId) => {
        setLoading(true);
        setMessage('');
        setError('');

        try {
            await adminService.activateAdmin(adminId, token);
            setMessage('Администратор успешно активирован');
            if (onSuccess) await onSuccess();
            return true;
        } catch (err) {
            setError(`${err.message}`);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Деактивация администратора
    const deactivateAdmin = async (adminId) => {
        setLoading(true);
        setMessage('');
        setError('');

        try {
            await adminService.deactivateAdmin(adminId, token);
            setMessage('Администратор успешно деактивирован');
            if (onSuccess) await onSuccess();
            return true;
        } catch (err) {
            setError(`${err.message}`);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Очистка сообщений
    const clearMessages = () => {
        setMessage('');
        setError('');
    };

    return {
        activateAdmin,
        deactivateAdmin,
        loading,
        message,
        error,
        clearMessages
    };
};