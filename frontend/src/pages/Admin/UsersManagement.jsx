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

  const formatDateOnly = (value) => {
    if (!value) return ' _ ';
    const raw = String(value);
    if (raw.includes('T')) return raw.split('T')[0];
    if (raw.includes(' ')) return raw.split(' ')[0];
    return raw.slice(0, 10);
  };

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Manrope:wght@400;500;600&display=swap');
      `}</style>
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
                    <th style={{ ...styles.th, ...styles.thCenter }}>Date of Birth</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td style={styles.td}>#{user.id}</td>
                      <td style={styles.td}>{user.email || ' _ '}</td>
                      <td style={styles.td}>{user.username || ' _ '}</td>
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
                      <td style={styles.td}>
                        {(() => {
                          const dobValue = formatDateOnly(
                            user.date_of_birth || user.dob || user.birth_date
                          );
                          const isEmpty = dobValue === ' _ ';
                          return (
                            <span
                              style={{
                                ...styles.dateCell,
                                ...(isEmpty ? styles.emptyCell : {}),
                              }}
                            >
                              {dobValue}
                            </span>
                          );
                        })()}
                      </td>
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
    background:
      'radial-gradient(circle at 12% 8%, rgba(201, 204, 187, 0.45), transparent 55%), radial-gradient(circle at 86% 4%, rgba(116, 135, 114, 0.25), transparent 45%), linear-gradient(160deg, #f7f5ee 0%, #eceee2 48%, #f7f4ef 100%)',
    padding: '24px',
    fontFamily: "'Manrope', sans-serif",
  },
  card: {
    background: '#ffffff',
    border: '1px solid rgba(33, 81, 34, 0.12)',
    borderRadius: '18px',
    padding: '20px',
    boxShadow: '0 18px 40px rgba(33, 81, 34, 0.12)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#215122',
    fontFamily: "'Fraunces', serif",
  },
  subtitle: {
    margin: '6px 0 0',
    color: 'rgba(33, 81, 34, 0.7)',
    fontSize: '14px',
  },
  backButton: {
    padding: '10px 20px',
    borderRadius: '999px',
    border: '1px solid rgba(33, 81, 34, 0.25)',
    background: '#fff',
    color: '#215122',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    boxShadow: '0 8px 16px rgba(33, 81, 34, 0.12)',
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
    borderBottom: '1px dashed rgba(33, 81, 34, 0.25)',
    fontWeight: 700,
    color: '#215122',
    fontSize: '14px',
    fontFamily: "'Fraunces', serif",
  },
  thCenter: {
    textAlign: 'center',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid rgba(33, 81, 34, 0.12)',
    fontSize: '14px',
    color: '#324035',
  },
  roleBadge: {
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    textTransform: 'capitalize',
  },
  verifiedBadge: {
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
  },
  dateCell: {
    display: 'block',
    textAlign: 'center',
  },
  emptyCell: {
    color: 'rgba(33, 81, 34, 0.5)',
  },
  message: {
    padding: '20px',
    textAlign: 'center',
    color: 'rgba(33, 81, 34, 0.7)',
  },
  error: {
    padding: '20px',
    textAlign: 'center',
    color: '#8b1d22',
    background: 'rgba(224, 46, 53, 0.12)',
    borderRadius: '12px',
    border: '1px solid rgba(224, 46, 53, 0.3)',
  },
};

export default UsersManagement;

