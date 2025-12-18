import React, { useEffect, useState } from 'react';
import api from '../../services/api';
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(15,23,42,0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(3px)',
};

const modalStyle = {
  background: '#ffffff',
  padding: '24px 28px 28px',
  borderRadius: '16px',
  width: '720px',
  maxWidth: '95vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 18px 45px rgba(15,23,42,0.16)',
  border: '1px solid #e2e8f0',
};

const headerStyle = {
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: '1px solid #e2e8f0',
};

const titleStyle = {
  margin: 0,
  fontSize: '20px',
  fontWeight: 700,
  color: '#0f172a',
};

const subtitleStyle = {
  margin: '4px 0 0',
  fontSize: '13px',
  color: '#64748b',
};

const sectionStyle = {
  marginBottom: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '14px',
};

const labelStyle = {
  fontWeight: 600,
  color: '#0f172a',
};

const inputStyle = {
  width: '100%',
  padding: '9px 10px',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  fontSize: '14px',
  background: '#f8fafc',
};

const textareaStyle = {
  width: '100%',
  padding: '9px 10px',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  fontSize: '14px',
  minHeight: '120px',
  background: '#f8fafc',
  resize: 'vertical',
};

const pillCheckboxLabelStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 10px',
  borderRadius: '999px',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  color: '#334155',
  marginRight: '8px',
  marginBottom: '8px',
};

const primaryButtonStyle = {
  padding: '9px 18px',
  borderRadius: '999px',
  border: 'none',
  background: '#2563eb',
  color: '#ffffff',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer',
};

const secondaryButtonStyle = {
  padding: '9px 16px',
  borderRadius: '999px',
  border: '1px solid #cbd5f5',
  background: '#ffffff',
  color: '#0f172a',
  fontWeight: 500,
  fontSize: '14px',
  cursor: 'pointer',
};

const EditGameModal = ({ game, onClose, onSave }) => {
  const [allGenres, setAllGenres] = useState([]);

  const [form, setForm] = useState({
    name: '',
    price_final: '',
    discount_percent: '',
    release_date: '',
    platforms: [],
    header_image: '',
    background: '',
    description: '',
    genres: [],
  });

  /* =========================
     Load game detail vào form
     ========================= */
  useEffect(() => {
    if (!game) return;

    setForm({
      name: game.name || '',
      price_final: game.price_final || '',
      discount_percent: game.discount_percent || 0,
      release_date: game.release_date
        ? game.release_date.slice(0, 10)
        : '',
      platforms: [
        game.platforms_windows && 'windows',
        game.platforms_mac && 'mac',
        game.platforms_linux && 'linux',
      ].filter(Boolean),
      header_image: game.header_image || '',
      background: game.background || '',
      description: game.detailed_description || '',
      genres: Array.isArray(game.genres)
        ? game.genres.map(g => g.id)
        : [],
    });
  }, [game]);


  /* =========================
     Load all genres
     ========================= */
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await api.get('/reference/genres');
        const genres = res.data?.data?.genres || [];
        setAllGenres(genres);
      } catch (err) {
        console.error('Failed to load genres', err);
      }
    };
    fetchGenres();
  }, []);

  /* =========================
     Handlers
     ========================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const togglePlatform = (platform) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const toggleGenre = (genreId) => {
    setForm(prev => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter(id => id !== genreId)
        : [...prev.genres, genreId],
    }));
  };

  /* =========================
     Submit update
     ========================= */
  const handleSubmit = async () => {
    const payload = {
      name: form.name,
      price_final: Number(form.price_final),
      discount_percent: Number(form.discount_percent),
      release_date: form.release_date || null,

      platforms_windows: form.platforms.includes('windows'),
      platforms_mac: form.platforms.includes('mac'),
      platforms_linux: form.platforms.includes('linux'),

      description: {
        detailed_description: form.description,
        header_image: form.header_image,
        background: form.background,
      },

      genres: form.genres,
    };

    try {
      await onSave(game.app_id, payload);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to update game');
    }
  };

  /* =========================
     Render
     ========================= */
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Edit Game #{game.app_id}</h2>
          <p style={subtitleStyle}>
            Adjust pricing, platforms, imagery and genres for this game.
          </p>
        </div>

        {/* Basic Info */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Game Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Price</label>
          <input
            type="number"
            name="price_final"
            value={form.price_final}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Discount (%)</label>
          <input
            type="number"
            name="discount_percent"
            value={form.discount_percent}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Release Date</label>
          <input
            type="date"
            name="release_date"
            value={form.release_date}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        {/* Platforms */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Platforms</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['windows', 'mac', 'linux'].map(p => (
              <label key={p} style={pillCheckboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={form.platforms.includes(p)}
                  onChange={() => togglePlatform(p)}
                />
                <span>{p}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Images */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Header Image URL</label>
          <input
            name="header_image"
            value={form.header_image}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Background Image URL</label>
          <input
            name="background"
            value={form.background}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        {/* Genres */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Genres</label>
          <div>
            {allGenres.map(g => (
              <label key={g.id} style={pillCheckboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={form.genres.includes(g.id)}
                  onChange={() => toggleGenre(g.id)}
                />
                <span>{g.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            style={textareaStyle}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={secondaryButtonStyle}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} style={primaryButtonStyle}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditGameModal;
