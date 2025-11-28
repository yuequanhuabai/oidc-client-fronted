import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { validateStateParameter } from '../services/oidcService';

export default function Callback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 从 URL 查询参数获取 state
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        // 检查是否有错误参数
        if (errorParam) {
          setError(`授权失败: ${errorParam}`);
          setLoading(false);
          return;
        }

        // 验证 state 参数（防止 CSRF 攻击）
        if (!state) {
          setError('缺少 state 参数，请重新登录');
          setLoading(false);
          return;
        }

        // 验证 state 参数
        const isValid = validateStateParameter(state);
        if (!isValid) {
          setError('State 验证失败，请重新登录');
          setLoading(false);
          return;
        }

        // Token 已经存储在 HttpOnly Cookie 中，无需前端处理
        // 清除 URL 中的查询参数
        window.history.replaceState(null, '', window.location.pathname);

        // 登录成功，重定向到仪表板
        navigate('/dashboard');
      } catch (err) {
        setError(`错误: ${err.message}`);
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {loading && (
          <>
            <div style={styles.spinner}></div>
            <p style={styles.text}>正在处理登录...</p>
          </>
        )}
        {error && (
          <>
            <p style={styles.error}>{error}</p>
            <button
              style={styles.button}
              onClick={() => navigate('/')}
            >
              返回登录
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    margin: '0 auto 20px',
    animation: 'spin 1s linear infinite'
  },
  text: {
    fontSize: '16px',
    color: '#666'
  },
  error: {
    color: '#d32f2f',
    marginBottom: '20px',
    fontSize: '14px'
  },
  button: {
    padding: '10px 20px',
    fontSize: '14px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};
