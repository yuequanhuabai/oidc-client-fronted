import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getUsername, isAuthenticated } from '../services/oidcService';
import { fetchUserProfile, fetchProtectedData } from '../services/api';

export default function Dashboard() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        // 检查是否已认证（通过 Cookie）
        if (!isAuthenticated()) {
          navigate('/');
          return;
        }

        // 从 Cookie 中获取用户名
        const cookieUsername = getUsername();
        setUsername(cookieUsername || 'User');

        // 加载用户资料和数据（Cookie 会自动携带）
        const [profileData, protectedData] = await Promise.all([
          fetchUserProfile().catch(() => null),
          fetchProtectedData().catch(() => null)
        ]);

        setProfile(profileData);
        setData(protectedData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    // logout() 函数会自动重定向到登录页
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>仪表板</h1>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          登出
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.section}>
          <h2>欢迎回来！</h2>
          <p>用户: <strong>{username}</strong></p>
        </div>

        {profile && (
          <div style={styles.section}>
            <h3>用户资料</h3>
            <div style={styles.infoBox}>
              <p><strong>ID:</strong> {profile.userId}</p>
              <p><strong>用户名:</strong> {profile.username}</p>
              <p><strong>邮箱:</strong> {profile.email}</p>
              <p><strong>角色:</strong> {profile.role}</p>
            </div>
          </div>
        )}

        {data && (
          <div style={styles.section}>
            <h3>受保护的数据</h3>
            <div style={styles.infoBox}>
              <p><strong>消息:</strong> {data.message}</p>
              <p><strong>时间戳:</strong> {new Date(data.timestamp).toLocaleString()}</p>
              <p><strong>项目:</strong> {data.items?.join(', ')}</p>
            </div>
          </div>
        )}

        <div style={styles.section}>
          <h3>系统信息</h3>
          <div style={styles.infoBox}>
            <p><strong>OIDC 服务器:</strong> http://localhost:8080</p>
            <p><strong>客户端后端:</strong> http://localhost:8082</p>
            <p><strong>前端:</strong> http://localhost:5173</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
  },
  header: {
    background: 'white',
    padding: '20px 40px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  content: {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '0 20px'
  },
  section: {
    background: 'white',
    padding: '20px',
    marginBottom: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  infoBox: {
    background: '#f9f9f9',
    padding: '15px',
    borderRadius: '4px',
    marginTop: '10px'
  },
  logoutBtn: {
    padding: '8px 16px',
    background: '#d32f2f',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    margin: '200px auto 0',
    animation: 'spin 1s linear infinite'
  }
};
