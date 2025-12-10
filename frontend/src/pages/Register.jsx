import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { referenceService } from '../services/referenceService';

const MultiSelect = ({ label, options = [], selected = [], onChange, placeholder = 'Select...' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const handleToggle = () => setOpen(!open);

  const handleSelect = (value) => {
    if (!onChange) return;
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const findLabel = (val) => {
    const item = options.find((o) => o.id === val);
    return item?.name || item?.title || item?.label || val;
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ marginBottom: '14px', position: 'relative' }}>
      <div style={styles.sectionLabel}>{label}</div>
      <div style={styles.selectShell} onClick={handleToggle}>
        <div style={styles.selectContent}>
          {selected.length === 0 && <span style={styles.placeholder}>{placeholder}</span>}
          {selected.map((val) => (
            <span key={val} style={styles.tag} onClick={(e) => e.stopPropagation()}>
              {findLabel(val)}
              <button
                style={styles.tagClose}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(val);
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <span style={styles.caret}>▾</span>
      </div>
      {open && (
        <div style={styles.dropdown}>
          {options.map((opt) => {
            const active = selected.includes(opt.id);
            return (
              <div
                key={opt.id || opt.name}
                style={{ ...styles.dropdownItem, ...(active ? styles.dropdownItemActive : {}) }}
                onClick={() => handleSelect(opt.id)}
              >
                <span>{opt.name || opt.title || opt.label}</span>
                {active && <span style={styles.check}>✓</span>}
              </div>
            );
          })}
          {options.length === 0 && <div style={styles.dropdownItem}>No options</div>}
        </div>
      )}
    </div>
  );
};

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState('register'); // register | verify
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPref, setShowPref] = useState(false);
  const [prefError, setPrefError] = useState('');
  const [prefLoading, setPrefLoading] = useState(false);
  const [refLoading, setRefLoading] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedLangs, setSelectedLangs] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const res = await authService.register(formData);
      const email = formData.email;
      setRegisteredEmail(email);
      setStep('verify');
      setInfo(res?.message || 'Check your email for the verification code.');
    } catch (err) {
      const apiError =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message;
      setError(apiError || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const res = await authService.verifyOTP({
        email: registeredEmail,
        otpCode,
      });
      setInfo(res?.message || 'Email verified!');

      // auto-login after verify
      await authService.login({
        identifier: registeredEmail,
        password: formData.password,
      });

      // load reference and open preference modal
      await loadReferenceData();
      setShowPref(true);
    } catch (err) {
      const apiError =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message;
      setError(apiError || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    setRefLoading(true);
    try {
      const normalize = (res) => {
        const d = res?.data ?? res;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.data)) return d.data;
        if (Array.isArray(d?.languages)) return d.languages;
        if (Array.isArray(d?.categories)) return d.categories;
        if (Array.isArray(d?.genres)) return d.genres;
        if (Array.isArray(d?.items)) return d.items;
        return [];
      };
      const [langs, cats, gens] = await Promise.all([
        referenceService.getLanguages(),
        referenceService.getCategories(),
        referenceService.getGenres(),
      ]);
      setLanguages(normalize(langs));
      setCategories(normalize(cats));
      setGenres(normalize(gens));
    } catch (err) {
      // ignore; handled in modal when submitting
    } finally {
      setRefLoading(false);
    }
  };

  const toggleSelect = (value, listSetter, current) => {
    if (current.includes(value)) {
      listSetter(current.filter((v) => v !== value));
    } else {
      listSetter([...current, value]);
    }
  };

  const savePreferences = async () => {
    setPrefError('');
    setPrefLoading(true);
    try {
      await userService.updateProfile({
        preferLangIds: selectedLangs,
        preferCateIds: selectedCats,
        preferGenreIds: selectedGenres,
        preferPlatforms: selectedPlatforms,
      });
      setShowPref(false);
      navigate('/');
    } catch (err) {
      const apiError =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message;
      setPrefError(apiError || 'Could not save preferences');
    } finally {
      setPrefLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>{step === 'register' ? 'Create account' : 'Verify your email'}</h1>
          <p style={styles.subtitle}>
            {step === 'register'
              ? 'Fill in your details to get started'
              : `We sent a code to ${registeredEmail || formData.email}`}
          </p>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {info && <div style={styles.info}>{info}</div>}

        {step === 'register' ? (
          <form onSubmit={handleRegister} style={styles.form}>
            <label style={styles.label}>
              Username
              <input
                style={styles.input}
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                autoComplete="username"
                placeholder="Your username"
              />
            </label>

            <div style={styles.row}>
              <label style={{ ...styles.label, flex: 1 }}>
                First Name
                <input
                  style={styles.input}
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="First name"
                />
              </label>
              <label style={{ ...styles.label, flex: 1 }}>
                Last Name
                <input
                  style={styles.input}
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Last name"
                />
              </label>
            </div>

            <label style={styles.label}>
              Email
              <input
                style={styles.input}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>

            <label style={styles.label}>
              Password
              <input
                style={styles.input}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="********"
              />
            </label>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} style={styles.form}>
            <label style={styles.label}>
              Verification code
              <input
                style={styles.input}
                type="text"
                name="otpCode"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
                placeholder="6-digit code"
              />
            </label>
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Verifying...' : 'Verify email'}
            </button>
            <div style={styles.muted}>
              Already verified? <Link to="/login" style={styles.link}>Go to login</Link>
            </div>
          </form>
        )}

        {step === 'register' && (
          <div style={styles.footer}>
            <span>Already have an account?</span>{' '}
            <Link to="/login" style={styles.link}>
              Login
            </Link>
          </div>
        )}
      </div>

      {showPref && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0 }}>Your preferences</h3>
                <p style={styles.muted}>Pick what you like for better recommendations.</p>
              </div>
            </div>

            {prefError && <div style={styles.error}>{prefError}</div>}

            <MultiSelect
              label="Languages"
              options={Array.isArray(languages) ? languages : []}
              selected={selectedLangs}
              onChange={setSelectedLangs}
              placeholder="Select languages"
            />
            <MultiSelect
              label="Categories"
              options={Array.isArray(categories) ? categories : []}
              selected={selectedCats}
              onChange={setSelectedCats}
              placeholder="Select categories"
            />
            <MultiSelect
              label="Genres"
              options={Array.isArray(genres) ? genres : []}
              selected={selectedGenres}
              onChange={setSelectedGenres}
              placeholder="Select genres"
            />

            <div>
              <div style={styles.sectionLabel}>Platforms</div>
              <div style={styles.platformGrid}>
                {['windows', 'mac', 'linux'].map((p) => {
                  const active = selectedPlatforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      style={{ ...styles.platformCard, ...(active ? styles.platformCardActive : {}) }}
                      onClick={() => toggleSelect(p, setSelectedPlatforms, selectedPlatforms)}
                    >
                      <span style={styles.platformIcon}>{p === 'windows' ? '🪟' : p === 'mac' ? '🍎' : '🐧'}</span>
                      <span style={styles.platformLabel}>{p}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                style={{ ...styles.button, ...styles.secondary }}
                onClick={() => setShowPref(false)}
                disabled={prefLoading}
              >
                Skip
              </button>
              <button type="button" style={styles.button} onClick={savePreferences} disabled={prefLoading}>
                {prefLoading ? 'Saving...' : 'Save preferences'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Register;

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8f9fb',
    padding: '32px 16px 48px',
    color: '#1f2937',
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '520px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    padding: '28px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
  },
  header: {
    marginBottom: '18px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#111827',
  },
  subtitle: {
    margin: '6px 0 0',
    color: '#6b7280',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '14px',
    color: '#374151',
  },
  input: {
    height: '44px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    color: '#111827',
    padding: '0 12px',
    fontSize: '14px',
    outline: 'none',
    boxShadow: 'none',
  },
  button: {
    height: '46px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '15px',
    cursor: 'pointer',
    marginTop: '6px',
    transition: 'transform 0.1s ease, box-shadow 0.2s ease',
    boxShadow: '0 10px 30px rgba(239,68,68,0.25)',
  },
  footer: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#4b5563',
  },
  link: {
    color: '#dc2626',
    textDecoration: 'none',
    fontWeight: 600,
  },
  error: {
    background: '#fef2f2',
    color: '#b91c1c',
    border: '1px solid #fecdd3',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '13px',
    marginBottom: '6px',
  },
  info: {
    background: '#ecfeff',
    color: '#0f766e',
    border: '1px solid #a5f3fc',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '13px',
    marginBottom: '6px',
  },
  row: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  muted: {
    marginTop: '4px',
    fontSize: '13px',
    color: '#6b7280',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: '14px',
    padding: '20px',
    width: '100%',
    maxWidth: '720px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  chipGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '12px',
  },
  chip: {
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    background: '#f9fafb',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#111827',
  },
  chipActive: {
    background: '#fee2e2',
    borderColor: '#fca5a5',
    color: '#b91c1c',
  },
  chipBullet: {
    marginRight: '8px',
    fontSize: '12px',
  },
  selectShell: {
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '10px',
    background: '#fff',
    minHeight: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    position: 'relative',
  },
  selectContent: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    flex: 1,
  },
  placeholder: {
    color: '#9ca3af',
    fontSize: '14px',
  },
  caret: {
    marginLeft: '8px',
    color: '#6b7280',
    fontSize: '12px',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '6px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    background: '#fff',
    maxHeight: '220px',
    overflowY: 'auto',
    boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
    zIndex: 10,
  },
  dropdownItem: {
    padding: '10px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#111827',
    borderBottom: '1px solid #f3f4f6',
  },
  dropdownItemActive: {
    background: '#fef2f2',
    color: '#b91c1c',
  },
  check: {
    marginLeft: '8px',
    fontWeight: 700,
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '999px',
    padding: '6px 10px',
    fontSize: '13px',
  },
  tagClose: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: '#b91c1c',
    fontSize: '12px',
    lineHeight: 1,
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '8px',
  },
  secondary: {
    background: '#e5e7eb',
    color: '#111827',
    boxShadow: 'none',
  },
  sectionLabel: {
    fontWeight: 600,
    margin: '10px 0 6px',
    color: '#111827',
  },
  platformGrid: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  platformCard: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    background: '#f9fafb',
    cursor: 'pointer',
    color: '#111827',
    boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
  },
  platformCardActive: {
    background: '#fee2e2',
    borderColor: '#fca5a5',
    color: '#b91c1c',
  },
  platformIcon: {
    fontSize: '16px',
  },
  platformLabel: {
    textTransform: 'capitalize',
    fontWeight: 600,
  },
};
