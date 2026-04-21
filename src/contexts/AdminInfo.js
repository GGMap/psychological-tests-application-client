import React, { useState, useEffect } from 'react';
import {API_URL} from '../config';
import {handleUnauthorized} from "./authUtils";

const AdminInfo = ({ userId, token }) => {
    const [surname, setSurname] = useState('');
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAdminInfo = async () => {
            if (!userId || !token) return;

            try {
                const response = await fetch(`${API_URL}/admins/${userId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    }
                });

                if (handleUnauthorized(response)) return;

                const data = await response.json();

                if (!response.ok) setError(data.message);

                setSurname(data.sname || '');
                setFirstName(data.fname || '');
                setMiddleName(data.mname || '');
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminInfo().catch(err => {
            console.error('Ошибка загрузки информации об администраторе:', err);
            setError('Не удалось загрузить данные');
        });
    }, [userId, token]);

    if (loading) return <span>Загрузка...</span>;
    if (error) return <span className="error">{error}</span>;

    const fullName = [surname, firstName, middleName].filter(n => n).join(' ');

    return <span>{fullName || 'Не указано'}</span>;
};

export default AdminInfo;