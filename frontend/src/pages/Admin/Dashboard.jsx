import React from 'react';
import Navbar from '../../components/layout/Navbar';

const AdminDashboard = () => {
  return (
    <>
      <Navbar />
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, admin. Manage the store here.</p>
          <div style={styles.grid}>
            <div style={styles.tile}>
              <div style={styles.tileLabel}>Orders</div>
              <div style={styles.tileValue}>—</div>
            </div>
            <div style={styles.tile}>
              <div style={styles.tileLabel}>Users</div>
              <div style={styles.tileValue}>—</div>
            </div>
            <div style={styles.tile}>
              <div style={styles.tileLabel}>Games</div>
              <div style={styles.tileValue}>—</div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminDashboard;

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
  title: {
    margin: 0,
    fontSize: '26px',
    fontWeight: 700,
    color: '#111827',
  },
  subtitle: {
    margin: '6px 0 16px',
    color: '#6b7280',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginTop: '12px',
  },
  tile: {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '12px',
    background: '#f9fafb',
  },
  tileLabel: {
    color: '#6b7280',
    fontSize: '13px',
    marginBottom: '6px',
  },
  tileValue: {
    fontWeight: 700,
    fontSize: '18px',
    color: '#111827',
  },
};
