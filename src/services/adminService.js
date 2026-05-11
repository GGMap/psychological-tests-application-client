import {API_URL} from "../config";
import { handleUnauthorized } from "../contexts/authUtils";

export const adminService = {
    activateAdmin: async (adminId, token) => {
        const response = await fetch(`${API_URL}/admins/${adminId}/activate`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (handleUnauthorized(response)) return;

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка активации');
        }

        return true;
    },

    deactivateAdmin: async (adminId, token) => {
        const response = await fetch(`${API_URL}/admins/${adminId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (handleUnauthorized(response)) return;

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка деактивации');
        }

        return true;
    },

    // Поиск администраторов
    searchAdmins: async (searchParams, token) => {
        const response = await fetch(`${API_URL}/admins/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(searchParams)
        });

        if (handleUnauthorized(response)) return;

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Ошибка поиска');
        }
        return data;
    },

    // Получение данных администратора по ID
    getAdminById: async (adminId, token) => {
        const response = await fetch(`${API_URL}/admins/${adminId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка загрузки данных администратора');
        }
        return response.json();
    },

    // Обновление персональных данных (ФИО, телефон)
    updateAdminProfile: async (adminId, profileData, token) => {
        // profileData: { sname, fname, mname, phoneNumber }
        const response = await fetch(`${API_URL}/admins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                id: adminId,
                ...profileData,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка обновления профиля');
        }
        if (response.status === 204) return true;
        return response.json();
    },
};