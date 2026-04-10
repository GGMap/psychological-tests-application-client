import React from 'react';
import { useNavigate } from 'react-router-dom';
import {useAuth} from "../contexts/AuthContext";

const Home = () => {
    const {isAuthenticated} = useAuth();
    const navigate = useNavigate();

   const handleAdminLogin = () => {
       navigate("/admin/signin");
   }

   const handleAdminProfile = () => {
       navigate("/admin/profile");
   }
    return (
        <div>
            <h1>Добро пожаловать на главную страницу</h1>
            <p>Здесь будут тесты и публичная информация.</p>
            {!isAuthenticated ? (
                <button onClick={handleAdminLogin}>
                    Вход
                </button>
            ) : (
                <button onClick={handleAdminProfile}>
                    Профиль
                </button>
            )}
        </div>

    );
};

export default Home;