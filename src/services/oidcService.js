const OIDC_SERVER_URL = 'http://localhost:8080';
const OIDC_CLIENT_ID = 'my-app';
const REDIRECT_URI = 'http://localhost:8081/callback'; // 后端接收授权码
const SCOPE = 'openid profile email';

// 生成随机 state
const generateState = () => {
  return Math.random().toString(36).substring(2, 15);
};

// 获取授权 URL
export const getAuthorizationUrl = () => {
  const state = generateState();
  sessionStorage.setItem('oidc_state', state);

  const params = new URLSearchParams({
    client_id: OIDC_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPE,
    state: state
  });

  return `${OIDC_SERVER_URL}/oidc/authorize?${params.toString()}`;
};

// 从 URL hash fragment 中获取 token（后端已经完成授权码交换）
export const getTokenFromHash = () => {
  const hash = window.location.hash.substring(1); // 去掉 #
  const params = new URLSearchParams(hash);

  const accessToken = params.get('access_token');
  const idToken = params.get('id_token');
  const username = params.get('username');

  if (accessToken) {
    // 保存 tokens
    localStorage.setItem('access_token', accessToken);
    if (idToken) {
      localStorage.setItem('id_token', idToken);
    }
    if (username) {
      localStorage.setItem('username', username);
    }

    sessionStorage.removeItem('oidc_state');

    // 清除 URL 中的 hash
    window.history.replaceState(null, '', window.location.pathname);

    return {
      access_token: accessToken,
      id_token: idToken,
      username: username
    };
  }

  return null;
};

// 交换授权码获取 Token
export const exchangeCodeForToken = async (code) => {
  try {
    const response = await fetch('http://localhost:8082/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, state: sessionStorage.getItem('oidc_state') })
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const data = await response.json();

    // 保存 tokens
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    if (data.id_token) {
      localStorage.setItem('id_token', data.id_token);
    }
    if (data.username) {
      localStorage.setItem('username', data.username);
    }

    sessionStorage.removeItem('oidc_state');

    return data;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};

// 获取 Access Token
export const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

// 获取用户信息
export const getUserInfo = async () => {
  try {
    const token = getAccessToken();
    if (!token) {
      return null;
    }

    const response = await fetch('http://localhost:8082/api/auth/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

// 检查是否已认证
export const isAuthenticated = () => {
  return !!getAccessToken();
};

// 登出
export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('id_token');
  localStorage.removeItem('username');
  sessionStorage.removeItem('oidc_state');
};
