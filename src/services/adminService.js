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
    }
};