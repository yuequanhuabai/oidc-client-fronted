import { getAccessToken } from './oidcService';

const API_BASE_URL = 'http://localhost:8082/api';

const getHeaders = () => {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      // Token expired or invalid
      window.location.href = '/';
      return null;
    }

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// 获取用户资料
export const fetchUserProfile = () => {
  return apiCall('/resources/profile');
};

// 获取保护的数据
export const fetchProtectedData = () => {
  return apiCall('/resources/data');
};
