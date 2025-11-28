const OIDC_SERVER_URL = 'http://localhost:8080';
const OIDC_CLIENT_ID = 'my-app';
const REDIRECT_URI = 'http://localhost:8081/callback'; // 后端接收授权码
const SCOPE = 'openid profile email';

// 生成随机 state（使用加密安全的随机数生成器）
const generateState = () => {
  // 使用 crypto.randomUUID() 生成强随机 state
  return crypto.randomUUID();
};

// 获取授权 URL
export const getAuthorizationUrl = () => {
  const state = generateState();
  const timestamp = Date.now();

  // 存储 state 和时间戳（用于防止重放攻击）
  const stateData = {
    state: state,
    timestamp: timestamp
  };
  sessionStorage.setItem('oidc_state', JSON.stringify(stateData));

  const params = new URLSearchParams({
    client_id: OIDC_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPE,
    state: state
  });

  return `${OIDC_SERVER_URL}/oidc/authorize?${params.toString()}`;
};

// State 有效期（毫秒）- 10 分钟
const STATE_VALIDITY_PERIOD = 10 * 60 * 1000;

// 从 URL hash fragment 中获取 token（后端已经完成授权码交换）
export const getTokenFromHash = () => {
  const hash = window.location.hash.substring(1); // 去掉 #
  const params = new URLSearchParams(hash);

  const accessToken = params.get('access_token');
  const idToken = params.get('id_token');
  const username = params.get('username');
  const returnedState = params.get('state');

  // 验证 state 参数以防止 CSRF 攻击
  const storedStateJson = sessionStorage.getItem('oidc_state');
  if (!returnedState || !storedStateJson) {
    console.error('State 参数缺失，可能存在 CSRF 攻击');
    sessionStorage.removeItem('oidc_state');
    throw new Error('State 验证失败，请重新登录');
  }

  let storedStateData;
  try {
    storedStateData = JSON.parse(storedStateJson);
  } catch (e) {
    console.error('State 数据格式错误'+e);
    sessionStorage.removeItem('oidc_state');
    throw new Error('State 验证失败，请重新登录');
  }

  // 验证 state 值是否匹配
  if (returnedState !== storedStateData.state) {
    console.error('State 参数不匹配，可能存在 CSRF 攻击');
    sessionStorage.removeItem('oidc_state');
    throw new Error('State 验证失败，请重新登录');
  }

  // 验证时间戳，防止重放攻击
  const currentTime = Date.now();
  const elapsedTime = currentTime - storedStateData.timestamp;
  if (elapsedTime > STATE_VALIDITY_PERIOD) {
    console.error(`State 已过期（已过 ${Math.floor(elapsedTime / 1000)} 秒），可能存在重放攻击`);
    sessionStorage.removeItem('oidc_state');
    throw new Error('登录会话已过期，请重新登录');
  }

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
    // 获取存储的 state 数据
    const storedStateJson = sessionStorage.getItem('oidc_state');
    let stateValue = null;
    if (storedStateJson) {
      try {
        const storedStateData = JSON.parse(storedStateJson);
        stateValue = storedStateData.state;
      } catch (e) {
        console.warn('Failed to parse stored state, using as plain string');
        stateValue = storedStateJson;
      }
    }

    const response = await fetch('http://localhost:8082/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, state: stateValue })
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
