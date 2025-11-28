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

/**
 * 验证 State 参数（防止 CSRF 攻击和重放攻击）
 * @param {string} returnedState - 从服务器返回的 state
 * @returns {boolean} - 验证是否通过
 */
export const validateStateParameter = (returnedState) => {
  if (!returnedState) {
    console.error('State 参数缺失');
    return false;
  }

  const storedStateJson = sessionStorage.getItem('oidc_state');
  if (!storedStateJson) {
    console.error('未找到存储的 state，可能存在 CSRF 攻击');
    return false;
  }

  let storedStateData;
  try {
    storedStateData = JSON.parse(storedStateJson);
  } catch (e) {
    console.error('State 数据格式错误: ' + e);
    sessionStorage.removeItem('oidc_state');
    return false;
  }

  // 验证 state 值是否匹配
  if (returnedState !== storedStateData.state) {
    console.error('State 参数不匹配，可能存在 CSRF 攻击');
    sessionStorage.removeItem('oidc_state');
    return false;
  }

  // 验证时间戳，防止重放攻击
  const currentTime = Date.now();
  const elapsedTime = currentTime - storedStateData.timestamp;
  if (elapsedTime > STATE_VALIDITY_PERIOD) {
    console.error(`State 已过期（已过 ${Math.floor(elapsedTime / 1000)} 秒），可能存在重放攻击`);
    sessionStorage.removeItem('oidc_state');
    return false;
  }

  // 验证通过，清除存储的 state
  sessionStorage.removeItem('oidc_state');
  return true;
};

/**
 * 从 Cookie 中获取值
 * @param {string} name - Cookie 名称
 * @returns {string|null} - Cookie 值
 */
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

/**
 * 获取用户名（从普通 Cookie 中读取）
 * @returns {string|null} - 用户名
 */
export const getUsername = () => {
  return getCookie('username');
};

/**
 * 获取用户信息
 * Cookie 会自动携带，无需手动添加 Token
 */
export const getUserInfo = async () => {
  try {
    const response = await fetch('http://localhost:8082/api/auth/user', {
      method: 'GET',
      credentials: 'include',  // 自动携带 Cookie
      headers: {
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

/**
 * 检查是否已认证（检查 Cookie 中是否有用户名）
 * @returns {boolean} - 是否已认证
 */
export const isAuthenticated = () => {
  // 检查 username Cookie 是否存在
  return !!getCookie('username');
};

/**
 * 登出（清除 HttpOnly Cookies）
 */
export const logout = async () => {
  try {
    // 调用后端登出端点清除 HttpOnly Cookies
    await fetch('http://localhost:8082/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 清除 sessionStorage
    sessionStorage.removeItem('oidc_state');

    // 重定向到登录页
    window.location.href = '/';
  } catch (error) {
    console.error('Error during logout:', error);
    // 即使后端调用失败，也清除 sessionStorage 并重定向
    sessionStorage.removeItem('oidc_state');
    window.location.href = '/';
  }
};
