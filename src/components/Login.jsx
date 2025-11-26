import { getAuthorizationUrl } from '../services/oidcService';

export default function Login() {
  const handleLogin = () => {
    window.location.href = getAuthorizationUrl();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>OIDC 登录</h1>
        <p style={styles.description}>
          通过 OpenID Connect 进行安全认证
        </p>
        <button style={styles.button} onClick={handleLogin}>
          使用 OIDC 登录
        </button>
        <p style={styles.info}>
          测试账号: admin / admin123
        </p>
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
  title: {
    fontSize: '28px',
    marginBottom: '16px',
    color: '#333'
  },
  description: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '30px',
    lineHeight: '1.6'
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: '#667eea',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.3s',
    marginBottom: '20px'
  },
  info: {
    fontSize: '12px',
    color: '#999'
  }
};
