export const API_BASE_URL = 'http://localhost:8000';

const getAuthHeaders = () => {
    const token = localStorage.getItem('agropath_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const checkHealth = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error("Health check failed:", error);
        throw error;
    }
};

// 1. Disease Detection
export const detectDisease = async (imageFile) => {
    try {
        const formData = new FormData();
        formData.append('file', imageFile);

        const response = await fetch(`${API_BASE_URL}/disease/detect`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders()
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to analyze image');
        }

        return await response.json();
    } catch (error) {
        console.error("Disease detection failed:", error);
        throw error;
    }
};

export const getDiseaseHistory = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/disease/history`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch disease history');
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch disease history:", error);
        throw error;
    }
};

export const getModelBenchmarks = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/disease/benchmarks`);
        if (!response.ok) throw new Error('Failed to fetch benchmark evaluation metrics');
        return await response.json();
    } catch (error) {
        console.error("Benchmark fetch failed:", error);
        throw error;
    }
};

// 2. Crop Recommendations
export const getCropRecommendations = async (params) => {
    try {
        const response = await fetch(`${API_BASE_URL}/crops/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(params)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to fetch crop recommendations');
        }
        return await response.json();
    } catch (error) {
        console.error("Crop recommendations failed:", error);
        throw error;
    }
};

export const getSoilTypes = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/crops/soil-types`);
        if (!response.ok) throw new Error('Failed to load soil types');
        return await response.json();
    } catch (error) {
        console.error("Soil types request failed:", error);
        throw error;
    }
};

export const getCropHistory = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/crops/history`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch crop history');
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch crop history:", error);
        throw error;
    }
};

// 3. Weather (Dedicated to Coimbatore, Tamil Nadu)
export const getWeather = async (city = 'Coimbatore') => {
    try {
        const response = await fetch(`${API_BASE_URL}/weather/current`);
        if (!response.ok) throw new Error('Failed to fetch Coimbatore weather data');
        return await response.json();
    } catch (error) {
        console.error("Weather request failed:", error);
        throw error;
    }
};

export const getForecast = async (city = 'Coimbatore') => {
    try {
        const response = await fetch(`${API_BASE_URL}/weather/forecast`);
        if (!response.ok) throw new Error('Failed to fetch Coimbatore weather forecast');
        return await response.json();
    } catch (error) {
        console.error("Forecast request failed:", error);
        throw error;
    }
};

// 4. Farming Assistant Chat
export const sendChatMessage = async (message, sessionId = null) => {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ message, session_id: sessionId })
        });
        if (!response.ok) throw new Error('Failed to send message');
        return await response.json();
    } catch (error) {
        console.error("Chat error:", error);
        throw error;
    }
};

export const getChatHistory = async (sessionId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`);
        if (!response.ok) throw new Error('Failed to load chat history');
        return await response.json();
    } catch (error) {
        console.error("Chat history fetch failed:", error);
        throw error;
    }
};

// 5. Authentication
export const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Login failed');
    }
    const data = await response.json();
    localStorage.setItem('agropath_token', data.access_token);
    localStorage.setItem('agropath_user', JSON.stringify(data.user));
    return data;
};

export const register = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Registration failed');
    }
    const data = await response.json();
    localStorage.setItem('agropath_token', data.access_token);
    localStorage.setItem('agropath_user', JSON.stringify(data.user));
    return data;
};

export const guestLogin = async () => {
    const response = await fetch(`${API_BASE_URL}/auth/guest`, { method: 'POST' });
    if (!response.ok) throw new Error('Guest login failed');
    const data = await response.json();
    localStorage.setItem('agropath_token', data.access_token);
    localStorage.setItem('agropath_user', JSON.stringify(data.user));
    return data;
};

export const logout = () => {
    localStorage.removeItem('agropath_token');
    localStorage.removeItem('agropath_user');
};

export const getCurrentUser = () => {
    try {
        const u = localStorage.getItem('agropath_user');
        return u ? JSON.parse(u) : null;
    } catch {
        return null;
    }
};
