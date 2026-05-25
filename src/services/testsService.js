import { API_URL } from '../config';

export const testsService = {
    searchTests: async (filters = {}) => {
        const defaultFilters = { isActive: true };
        const body = { ...defaultFilters, ...filters };

        const response = await fetch(`${API_URL}/tests/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка загрузки тестов');
        }

        return response.json();
    },

    searchAllTests: async (filters = {}, token) => {
        const response = await fetch(`${API_URL}/tests/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            body: JSON.stringify(filters),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка поиска тестов');
        }
        return response.json();
    },

    updateTestStatus: async (testId, isActive, token) => {
        const response = await fetch(`${API_URL}/tests/${testId}/update-status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ isActive }),
        });

        if (response.status === 204) {
            return { success: true };
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка обновления статуса');
        }
        return response.json();
    },

    // Вопросы
    searchQuestions: async (testId, token) => {
        const response = await fetch(`${API_URL}/questions/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            body: JSON.stringify({ testId }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка загрузки вопросов');
        }
        return response.json();
    },

    updateQuestion: async (questionId, updates, token) => {
        const response = await fetch(`${API_URL}/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                id: questionId,
                testId: updates.testId,
                text: updates.text,
                type: updates.type,
                position: updates.position,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка обновления вопроса');
        }
        if (response.status === 204) return true;
        return response.json();
    },

    deleteQuestion: async (questionId, token) => {
        const response = await fetch(`${API_URL}/questions/${questionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка удаления вопроса');
        }
        return true;
    },

    createQuestion: async (questionData, token) => {
        const response = await fetch(`${API_URL}/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(questionData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка создания вопроса');
        }
        if (response.status === 204) return true;
        return response.json();
    },

    // Варианты ответов
    searchAnswerOptions: async (questionId, token) => {
        const response = await fetch(`${API_URL}/answer-options/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            body: JSON.stringify({ questionId }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка загрузки вариантов ответа');
        }
        return response.json();
    },

    createAnswerOption: async (optionData, token) => {
        const response = await fetch(`${API_URL}/answer-options`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                questionId: optionData.questionId,
                text: optionData.text,
                score: optionData.score,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка создания варианта');
        }
        return response.json();
    },

    updateAnswerOption: async (optionId, updates, token) => {
        const response = await fetch(`${API_URL}/answer-options`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                id: optionId,
                questionId: updates.questionId,
                text: updates.text,
                score: updates.score,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка обновления варианта');
        }
        if (response.status === 204) return true;
        return response.json();
    },

    deleteAnswerOption: async (optionId, token) => {
        const response = await fetch(`${API_URL}/answer-options/${optionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка удаления варианта');
        }
        return true;
    },

    // Студенты
    searchFaculties: async (filters = {}) => {
        const response = await fetch(`${API_URL}/faculties/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filters),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка загрузки факультетов');
        }
        return response.json();
    },

    createStudent: async (studentData) => {
        const response = await fetch(`${API_URL}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка регистрации студента');
        }
        return response.json();
    },

    //  Попытки прохождения
    createTestAttempt: async (studentId, testId, attemptDate = new Date().toISOString()) => {
        const response = await fetch(`${API_URL}/test-attempts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, testId, attemptDate }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка создания попытки');
        }
        return response.json();
    },

    // Ответы студента
    sendStudentAnswer: async (testAttemptId, questionId, answerOptionId) => {
        const response = await fetch(`${API_URL}/student-answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                testAttemptId,
                questionId,
                answerOptionId,
                answerValue: "none",
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка сохранения ответа');
        }
        return response.json();
    },

    // Получение результатов
    getTestScores: async (testAttemptId, token) => {
        const response = await fetch(`${API_URL}/test-attempt-scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify({ testAttemptId }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка получения результатов');
        }
        return response.json();
    },

    // Получение шкалы по ID
    getScaleById: async (scaleId) => {
        const response = await fetch(`${API_URL}/scales/${scaleId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка загрузки шкалы');
        }
        return response.json();
    },

    searchStudents: async (filters = {}, token) => {
        const response = await fetch(`${API_URL}/students/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            body: JSON.stringify(filters),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка поиска студентов');
        }
        return response.json();
    },

    searchTestAttempts: async (filters, token) => {
        const response = await fetch(`${API_URL}/test-attempts/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(filters),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка поиска попыток');
        }
        return response.json();
    },

    // Поиск результатов по шкалам (баллы и интерпретации) для попытки
    searchTestScores: async (testAttemptId, token) => {
        const response = await fetch(`${API_URL}/test-attempt-scores/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ testAttemptId }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка получения результатов');
        }
        return response.json();
    },

    // Поиск детальных ответов на вопросы (для попытки)
    searchStudentAnswers: async (testAttemptId, token) => {
        const response = await fetch(`${API_URL}/student-answers/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ testAttemptId }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка получения ответов');
        }
        return response.json();
    },

    // Получение варианта ответа по ID
    getAnswerOptionById: async (optionId) => {
        const response = await fetch(`${API_URL}/answer-options/${optionId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка загрузки варианта ответа');
        }
        return response.json();
    },

    // Получение вопроса по ID (публичный)
    getQuestionById: async (questionId) => {
        const response = await fetch(`${API_URL}/questions/${questionId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка загрузки вопроса');
        }
        return response.json();
    },

    // Методики
    searchMethodologies: async (filters = {}, token) => {
        const response = await fetch(`${API_URL}/methodologies/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(filters),
        });
        if (!response.ok) throw new Error('Ошибка загрузки методик');
        return response.json();
    },
    createMethodology: async (data, token) => {
        const response = await fetch(`${API_URL}/methodologies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Ошибка создания методики');
        return response.json();
    },
    updateMethodology: async (id, data, token) => {
        const response = await fetch(`${API_URL}/methodologies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ id, ...data }),
        });
        if (!response.ok) throw new Error('Ошибка обновления методики');
        return response.json();
    },
    deleteMethodology: async (id, token) => {
        const response = await fetch(`${API_URL}/methodologies/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Ошибка удаления методики');
        return true;
    },

    // Шкалы
    searchScales: async (filters, token) => {
        const response = await fetch(`${API_URL}/scales/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(filters),
        });
        if (!response.ok) throw new Error('Ошибка загрузки шкал');
        return response.json();
    },
    createScale: async (data, token) => {
        const response = await fetch(`${API_URL}/scales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Ошибка создания шкалы');
        return response.json();
    },
    updateScale: async (id, data, token) => {
        const response = await fetch(`${API_URL}/scales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ id, ...data }),
        });
        if (!response.ok) throw new Error('Ошибка обновления шкалы');
        return response.json();
    },
    deleteScale: async (id, token) => {
        const response = await fetch(`${API_URL}/scales/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Ошибка удаления шкалы');
        return true;
    },

    // Диапазоны интерпретации
    searchScoreRanges: async (filters, token) => {
        const response = await fetch(`${API_URL}/score-ranges/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(filters),
        });
        if (!response.ok) throw new Error('Ошибка загрузки диапазонов');
        return response.json();
    },
    createScoreRange: async (data, token) => {
        const response = await fetch(`${API_URL}/score-ranges`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Ошибка создания диапазона');
        return response.json();
    },
    updateScoreRange: async (id, data, token) => {
        const response = await fetch(`${API_URL}/score-ranges`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ id, ...data }),
        });
        if (!response.ok) throw new Error('Ошибка обновления диапазона');
        return response.json();
    },
    deleteScoreRange: async (id, token) => {
        const response = await fetch(`${API_URL}/score-ranges/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Ошибка удаления диапазона');
        return true;
    },

    // Тесты
    createTest: async (data, token) => {
        const response = await fetch(`${API_URL}/tests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Ошибка создания теста');
        return response.json();
    },
    updateTest: async (id, data, token) => {
        const response = await fetch(`${API_URL}/tests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ id, ...data }),
        });
        if (!response.ok) throw new Error('Ошибка обновления теста');
        return response.json();
    },
    deleteTest: async (id, token) => {
        const response = await fetch(`${API_URL}/tests/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Ошибка удаления теста');
        return true;
    },
    getTestById: async (testId) => {
        const response = await fetch(`${API_URL}/tests/${testId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Ошибка загрузки теста');
        return response.json();
    },

    deleteTestAttempt: async (attemptId, token) => {
        const response = await fetch(`${API_URL}/test-attempts/${attemptId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка удаления попытки');
        }
        return true;
    },

    // Связи шкала-вопрос
    searchScaleQuestions: async (filters, token) => {
        const response = await fetch(`${API_URL}/scale-questions/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(filters),
        });
        if (!response.ok) throw new Error('Ошибка загрузки связей');
        return response.json();
    },
    createScaleQuestion: async (data, token) => {
        const response = await fetch(`${API_URL}/scale-questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Ошибка создания связи');
        return response.json();
    },
    deleteScaleQuestion: async (id, token) => {
        const response = await fetch(`${API_URL}/scale-questions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Ошибка удаления связи');
        return true;
    },

    //Создание отчета
    generateReport: async (params, token) => {
        const response = await fetch(`${API_URL}/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(params),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка формирования отчёта');
        }
        return response.blob();
    },
};