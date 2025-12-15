import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  let token = localStorage.getItem('access_token') || localStorage.getItem('token');
  
  if (!token) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'access_token' || name === 'token') {
        token = value;
        break;
      }
    }
  }
  
  console.log('API Request:', config.method?.toUpperCase(), config.url);
  console.log('Token available:', !!token);
  console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'none');
  
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', error);
    console.error('Response:', error.response);
    console.error('Status:', error.response?.status);
    
    if (error.response?.data instanceof Blob) {
      try {
        const errorText = await error.response.data.text();
        console.error('Error blob text:', errorText);
        const errorJson = JSON.parse(errorText);
        console.error('Parsed error:', errorJson);
        error.response.data = errorJson;
      } catch (e) {
        console.error('Could not parse error blob:', e);
      }
    } else {
      console.error('Error data:', error.response?.data);
    }
    
    if (error.response?.status === 401 && !error.config?.url?.includes('/exportar/')) {
      console.log('Redirecting to login due to 401 error');
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
