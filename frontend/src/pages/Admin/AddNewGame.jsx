import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import { referenceService } from '../../services/referenceService';

// Reusable multiselect (same UX pattern as Profile page)
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
    <div
      ref={containerRef}
      style={{ marginBottom: '4px', position: 'relative', textAlign: 'left' }}
    >
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

const AddNewGame = () => {
  const [form, setForm] = useState({
    name: '',
    price_final: '',
    discount_percent: 0,
    release_date: '',
    platforms: [],
    // Publishers / developers are typed manually as names (comma separated)
    publishers: '',
    developers: '',
    // These are now arrays of IDs selected from dropdowns
    categories: [],
    genres: [],
    languages: [],
    description: '',
    header_image: '',
    background: '',
  });

  const [refOptions, setRefOptions] = useState({
    languages: [],
    genres: [],
    categories: [],
  });

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [langsRes, genresRes, categoriesRes] = await Promise.all([
          referenceService.getLanguages(),
          referenceService.getGenres(),
          referenceService.getCategories(),
        ]);

        const normalizeList = (res, key) => {
          const list =
            res?.data?.[key] ||
            res?.[key] ||
            res?.data ||
            res ||
            [];
          return Array.isArray(list) ? list : [];
        };

        setRefOptions({
          languages: normalizeList(langsRes, 'languages'),
          genres: normalizeList(genresRes, 'genres'),
          categories: normalizeList(categoriesRes, 'categories'),
        });
      } catch (err) {
        console.error('Failed to load reference data for game creation:', err);
      }
    };

    loadReferences();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setForm((prev) => ({
        ...prev,
        platforms: checked
          ? [...prev.platforms, value]
          : prev.platforms.filter((p) => p !== value),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const toNumberArray = (arr) =>
      (Array.isArray(arr) ? arr : [])
        .map((val) => Number(val))
        .filter((n) => !Number.isNaN(n));

    const publisherNames = form.publishers
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const developerNames = form.developers
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: form.name,
      price_final: Number(form.price_final),
      price_org: Number(form.price_final),
      discount_percent: Number(form.discount_percent),
      release_date: form.release_date || null,

      // array of platform codes for backend helper
      platforms: form.platforms,
      platforms_windows: form.platforms.includes('windows'),
      platforms_mac: form.platforms.includes('mac'),
      platforms_linux: form.platforms.includes('linux'),

      // Names; backend will resolve or create publishers/developers
      publishers: publisherNames,
      developers: developerNames,

      // IDs from dropdowns
      categories: toNumberArray(form.categories),
      genres: toNumberArray(form.genres),
      languages: toNumberArray(form.languages),

      description: {
        detailed_description: form.description,
        header_image: form.header_image,
        background: form.background,
      },
    };

    try {
      await api.post('/admin/games', payload);
      alert('Game created successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to create game');
    }
  };

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Manrope:wght@400;500;600&display=swap');
      `}</style>
      <main style={styles.page}>
        <form style={styles.card} onSubmit={handleSubmit}>
          <h1 style={styles.title}>Add New Game</h1>
          <p style={styles.subtitle}>
            Fill in the details below to publish a new game to the store.
          </p>

          <div style={styles.field}>
            <label style={styles.label}>Game name</label>
            <input
              name="name"
              placeholder="Enter game name"
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inlineFields}>
            <div style={styles.field}>
              <label style={styles.label}>Price</label>
              <input
                name="price_final"
                type="number"
                placeholder="0.00"
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Discount %</label>
              <input
                name="discount_percent"
                type="number"
                placeholder="0"
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Release date</label>
              <input
                name="release_date"
                type="date"
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Platforms</label>
            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" value="windows" onChange={handleChange} /> Windows
              </label>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" value="mac" onChange={handleChange} /> Mac
              </label>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" value="linux" onChange={handleChange} /> Linux
              </label>
            </div>
          </div>

          {/* Reference dropdowns (from database) */}
          <MultiSelect
            label="Categories"
            options={refOptions.categories}
            selected={form.categories}
            onChange={(vals) => setForm((prev) => ({ ...prev, categories: vals }))}
            placeholder="Select categories"
          />

          <MultiSelect
            label="Genres"
            options={refOptions.genres}
            selected={form.genres}
            onChange={(vals) => setForm((prev) => ({ ...prev, genres: vals }))}
            placeholder="Select genres"
          />

          <MultiSelect
            label="Languages"
            options={refOptions.languages}
            selected={form.languages}
            onChange={(vals) => setForm((prev) => ({ ...prev, languages: vals }))}
            placeholder="Select languages"
          />

          {/* Publishers / developers typed manually, backend resolves or creates */}
          <div style={styles.field}>
            <label style={styles.label}>Publishers</label>
            <input
              name="publishers"
              placeholder="Publisher names, e.g. Valve, CD PROJEKT RED"
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Developers</label>
            <input
              name="developers"
              placeholder="Developer names, e.g. FromSoftware"
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Header image URL</label>
            <input
              name="header_image"
              placeholder="https://..."
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Background image URL</label>
            <input
              name="background"
              placeholder="https://..."
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Detailed description</label>
            <textarea
              name="description"
              placeholder="Write a short marketing description for this game"
              rows={4}
              onChange={handleChange}
              style={styles.textarea}
            />
          </div>

          <div style={styles.actions}>
            <button type="submit" style={styles.primaryButton}>
              Create Game
            </button>
          </div>
        </form>
      </main>
    </>
  );
};

export default AddNewGame;

const styles = {
  page: {
    padding: '32px',
    background:
      'radial-gradient(circle at 12% 8%, rgba(201, 204, 187, 0.45), transparent 55%), radial-gradient(circle at 86% 4%, rgba(116, 135, 114, 0.25), transparent 45%), linear-gradient(160deg, #f7f5ee 0%, #eceee2 48%, #f7f4ef 100%)',
    minHeight: '100vh',
    fontFamily: "'Manrope', sans-serif",
  },
  card: {
    background: '#ffffff',
    padding: '24px 28px 28px',
    maxWidth: '720px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    borderRadius: '18px',
    boxShadow: '0 18px 40px rgba(33, 81, 34, 0.12)',
    border: '1px solid rgba(33, 81, 34, 0.12)',
  },
  title: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#215122',
    margin: 0,
    fontFamily: "'Fraunces', serif",
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(33, 81, 34, 0.7)',
    margin: 0,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '14px',
  },
  label: {
    fontWeight: 600,
    color: '#1c231f',
  },
  input: {
    padding: '9px 10px',
    borderRadius: '10px',
    border: '1px solid rgba(33, 81, 34, 0.2)',
    fontSize: '14px',
    background: '#fff',
  },
  textarea: {
    padding: '9px 10px',
    borderRadius: '10px',
    border: '1px solid rgba(33, 81, 34, 0.2)',
    fontSize: '14px',
    minHeight: '120px',
    background: '#fff',
    resize: 'vertical',
  },
  inlineFields: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px 16px',
  },
  checkboxGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px 16px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: '#324035',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
  primaryButton: {
    padding: '10px 18px',
    borderRadius: '999px',
    border: 'none',
    background: 'linear-gradient(135deg, #215122, #748772)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 10px 18px rgba(33, 81, 34, 0.2)',
  },

  // Multiselect styles (aligned with Profile page)
  sectionLabel: {
    fontWeight: 600,
    margin: '4px 0 6px',
    color: '#1c231f',
    fontSize: '0.9rem',
  },
  selectShell: {
    border: '1px solid rgba(33, 81, 34, 0.2)',
    borderRadius: '10px',
    padding: '10px',
    background: '#fff',
    minHeight: '44px',
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
    color: 'rgba(33, 81, 34, 0.5)',
    fontSize: '14px',
  },
  caret: {
    marginLeft: '8px',
    color: '#215122',
    fontSize: '12px',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '6px',
    border: '1px solid rgba(33, 81, 34, 0.2)',
    borderRadius: '10px',
    background: '#fff',
    maxHeight: '220px',
    overflowY: 'auto',
    boxShadow: '0 12px 30px rgba(33, 81, 34, 0.12)',
    zIndex: 10,
  },
  dropdownItem: {
    padding: '10px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#1c231f',
    borderBottom: '1px solid rgba(33, 81, 34, 0.1)',
    fontSize: '0.9rem',
  },
  dropdownItemActive: {
    background: 'rgba(33, 81, 34, 0.1)',
    color: '#215122',
  },
  check: {
    marginLeft: '8px',
    fontWeight: 700,
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(33, 81, 34, 0.12)',
    color: '#215122',
    borderRadius: '999px',
    padding: '4px 8px',
    fontSize: '12px',
  },
  tagClose: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: '#215122',
    fontSize: '12px',
    lineHeight: 1,
  },
};
