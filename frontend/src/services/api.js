export const API_BASE_URL = 'http://localhost:8000';

export const checkHealth = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error("Health check failed:", error);
        throw error;
    }
};

export const detectDisease = async (imageFile) => {
    try {
        const formData = new FormData();
        formData.append('file', imageFile);

        const response = await fetch(`${API_BASE_URL}/disease/detect`, {
            method: 'POST',
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
