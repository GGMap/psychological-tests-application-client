export const handleUnauthorized = (response) => {
    if (response.status === 401) {
        localStorage.removeItem('jwt_token');
        alert('Сессия истекла. Пожалуйста, войдите снова.');
        window.location.href = '/admin/signin';
        return true;
    }
    return false;
};
