import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { adminService } from '../../services/adminService';

const UsersManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await adminService.getAllUsers();
        // adminService.getAllUsers() trả về response.data từ backend:
        // { success: true, data: { users: [...] }, message }
        const list =
          response?.data?.users ||
          response?.users ||
          [];
        setUsers(Array.isArray(list) ? list : []);
      } catch (err) {
        const msg =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to load users';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const getRoleColor = (role) => {
    const roleColors = {
      admin: '#8b5cf6',
      user: '#3b82f6',
    };
    return roleColors[role] || '#6b7280';
  };

  return (
    <>
      <Navbar />
      <main style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Users Management</h1>
              <p style={styles.subtitle}>View and manage all users</p>
            </div>
            <button style={styles.backButton} onClick={() => navigate('/admin')}>
              Back to Dashboard
            </button>
          </div>

          {loading ? (
            <div style={styles.message}>Loading users...</div>
          ) : error ? (
            <div style={styles.error}>{error}</div>
          ) : users.length === 0 ? (
            <div style={styles.message}>No users found.</div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Username</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Verified</th>
                    <th style={styles.th}>Country</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td style={styles.td}>#{user.id}</td>
                      <td style={styles.td}>{user.email || '—'}</td>
                      <td style={styles.td}>{user.username || '—'}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.roleBadge,
                            backgroundColor: getRoleColor(user.role),
                          }}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.verifiedBadge,
                            backgroundColor: user.is_verified ? '#10b981' : '#ef4444',
                          }}
                        >
                          {user.is_verified ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td style={styles.td}>{user.country || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8f9fb',
    padding: '24px',
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 15px 40px rgba(0,0,0,0.06)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    fontSize: '26px',
    fontWeight: 700,
    color: '#111827',
  },
  subtitle: {
    margin: '6px 0 0',
    color: '#6b7280',
    fontSize: '14px',
  },
  backButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    background: '#f9fafb',
    color: '#111827',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '14px',
    transition: 'background 0.2s',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #e5e7eb',
    fontWeight: 600,
    color: '#111827',
    fontSize: '14px',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '14px',
    color: '#374151',
  },
  roleBadge: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    textTransform: 'capitalize',
  },
  verifiedBadge: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
  },
  message: {
    padding: '20px',
    textAlign: 'center',
    color: '#6b7280',
  },
  error: {
    padding: '20px',
    textAlign: 'center',
    color: '#ef4444',
    background: '#fef2f2',
    borderRadius: '8px',
  },
};

export default UsersManagement;

