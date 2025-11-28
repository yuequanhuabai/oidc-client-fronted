const API_BASE_URL = 'http://localhost:8082/api';

/**
 * API 调用封装
 * 使用 HttpOnly Cookie 自动携带认证信息
 */
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    credentials: 'include',  // 自动携带 HttpOnly Cookie
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      // Token expired or invalid, redirect to login
      console.warn('Unauthorized, redirecting to login');
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
