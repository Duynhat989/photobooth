import axios from 'axios';
const request = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api/`,
    timeout: 120000,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    },
});

// Interceptor cho request
request.interceptors.request.use(config => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('photobooth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => Promise.reject(error));

export default request;