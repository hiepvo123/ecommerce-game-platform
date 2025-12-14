// frontend/src/pages/Profile.jsx
import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar.jsx';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user , setUser} = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    dateOfBirth: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // ------------------
  //  NEW: WISHLIST STATES (implemented)
  // ------------------
  const [wishlist, setWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  // ---------------------

  // ------------------
  //  NEW: LIBRARY STATES (owned games)
  // ------------------
  const [library, setLibrary] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  // ---------------------

  // Backend returns all game fields (g.*) plus wishlist-specific fields
  // No mapping needed - backend already provides all required fields
  const mapWishlistItem = (raw) => raw;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile();
        // backend returns { success: true, data: { profile: { ... } }, message: ... }
        const profileData = data?.data?.profile ?? data?.profile ?? data;
        setProfile(profileData);
        // Format date_of_birth for input field (YYYY-MM-DD format)
        const dateOfBirth = profileData?.date_of_birth 
          ? String(profileData.date_of_birth).slice(0, 10) 
          : '';
        setFormData({
          username: profileData?.username || '',
          email: profileData?.email || '',
          dateOfBirth: dateOfBirth
        });
      } catch (e) {
        console.error("Error fetching profile:", e);
      } finally {
        setLoading(false);
      }
    };

    // ------------------
    // NEW: Fetch Wishlist (implemented)
    // ------------------
    const fetchWishlist = async () => {
      try {
        const response = await userService.getWishlist();
        // Backend returns: { success: true, data: { games: [...], count, limit, offset }, message }
        // userService.getWishlist() returns response.data, so we get the full response object
        let gamesRaw = [];
        if (response?.data?.games && Array.isArray(response.data.games)) {
          gamesRaw = response.data.games;
        } else if (Array.isArray(response?.data)) {
          gamesRaw = response.data;
        } else if (Array.isArray(response?.games)) {
          gamesRaw = response.games;
        } else if (Array.isArray(response)) {
          gamesRaw = response;
        }

        // Map each item to proper keys (backend returns snake_case, we keep it for consistency)
        const games = gamesRaw.map(mapWishlistItem);

        setWishlist(games);
      } catch (err) {
        console.error("Failed to load wishlist", err);
        setWishlist([]);
      } finally {
        setLoadingWishlist(false);
      }
    };
    // ---------------------

    // ------------------
    // NEW: Fetch Library (owned games)
    // ------------------
    const fetchLibrary = async () => {
      try {
        const response = await userService.getLibrary();
        // Backend returns: { success: true, data: { games: [...], count, limit, offset }, message }
        let gamesRaw = [];
        if (response?.data?.games && Array.isArray(response.data.games)) {
          gamesRaw = response.data.games;
        } else if (Array.isArray(response?.data)) {
          gamesRaw = response.data;
        } else if (Array.isArray(response?.games)) {
          gamesRaw = response.games;
        } else if (Array.isArray(response)) {
          gamesRaw = response;
        }

        // Map each item to proper keys (backend returns snake_case, we keep it for consistency)
        const games = gamesRaw.map((raw) => raw);

        setLibrary(games);
      } catch (err) {
        console.error("Failed to load library", err);
        setLibrary([]);
      } finally {
        setLoadingLibrary(false);
      }
    };
    // ---------------------

    fetchProfile();
    fetchWishlist();
    fetchLibrary();
  }, []);

  const handleEditToggle = () => {
    setEditing(!editing);
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      const updatedData = await userService.updateProfile(formData);

      // backend returns { success: true, data: { profile: { ... } }, message: ... }
      const updatedProfile = updatedData?.data?.profile ?? updatedData?.profile ?? updatedData;

      setProfile(updatedProfile);

      // Format date_of_birth for input field (YYYY-MM-DD format)
      const dateOfBirth = updatedProfile?.date_of_birth 
        ? String(updatedProfile.date_of_birth).slice(0, 10) 
        : '';
      setFormData({
        username: updatedProfile?.username ?? '',
        email: updatedProfile?.email ?? '',
        dateOfBirth: dateOfBirth
      });

      setSuccess('Profile updated successfully!');
      setEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      console.error("Error updating profile:", e);
      const errorMessage = e?.response?.data?.error?.message || e?.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
    }
  };

  if (loading) return <div>Loading...</div>;

  const displayName = (() => {
    if (profile?.username && profile.username.trim() !== '') {
      return profile.username;
    }
  
    if (
      (profile?.firstName && profile.firstName.trim() !== '') ||
      (profile?.lastName && profile.lastName.trim() !== '')
    ) {
      return `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim();
    }
  
    if (profile?.email) {
      return profile.email.split('@')[0];
    }
  
    return 'User';
  })();
  

  // Format date_of_birth for display (YYYY-MM-DD -> DD/MM/YYYY or show "Not set")
  const birthDate = profile?.date_of_birth 
    ? (() => {
        const dateStr = String(profile.date_of_birth).slice(0, 10);
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      })()
    : 'Not set';


  return (
    <>
      <Navbar />

      <div style={styles.container}>
        <h1 style={styles.title}>Your Profile</h1>

        <div style={styles.card}>
          <div style={styles.cardLeft}>
            <div style={styles.avatarColumn}>
              <div style={styles.avatarContainer}>
                <span style={styles.avatarIcon}>👤</span>
              </div>
              <div style={styles.avatarName}>{displayName}</div>
            </div>

            <div style={styles.infoColumn}>
              <p style={styles.email}>{profile?.email}</p>
              <p style={styles.birthDate}>Date of Birth: {birthDate}</p>
              <p style={styles.role}>Role: {profile?.role || (user?.role ?? 'user')}</p>
            </div>
          </div>

          <div style={styles.cardRight}>
            {!editing ? (
              <button style={styles.editBtn} onClick={handleEditToggle}>
                Edit Profile
              </button>
            ) : (
              <>
                {error && (
                  <div style={styles.errorMessage}>{error}</div>
                )}
                {success && (
                  <div style={styles.successMessage}>{success}</div>
                )}
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  style={styles.input}
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={styles.input}
                />
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  placeholder="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  style={styles.input}
                />
                <div style={styles.actionsRow}>
                  <button style={styles.saveBtn} onClick={handleSave}>Save</button>
                  <button style={styles.cancelBtn} onClick={() => {
                    setEditing(false);
                    setError(null);
                    setSuccess(null);
                  }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* --------------------------------------- */}
        {/* OWNED GAMES — FULL IMPLEMENTATION */}
        {/* --------------------------------------- */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Owned Games</h2>

          {loadingLibrary ? (
            <div style={styles.placeholderBox}>Loading owned games...</div>
          ) : library.length === 0 ? (
            <div style={styles.placeholderBox}>You don't own any games yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              {library.map((game) => (
                <div key={game.app_id} style={styles.gameCard}>
                  <img
                    src={game.header_image || game.background || ''}
                    alt={game.name || 'Game'}
                    style={{ width: "100%", borderRadius: "10px", objectFit: "cover", height: 120 }}
                  />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{game.name || 'Untitled Game'}</h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
                      {game.price_final != null ? (
                        <>
                          <span style={{ color: '#111' }}>${Number(game.price_final).toFixed(2)}</span>
                          {game.price_org && Number(game.price_org) > Number(game.price_final) && (
                            <span style={{ textDecoration: 'line-through', marginLeft: 8, color: '#9ca3af' }}>
                              ${Number(game.price_org).toFixed(2)}
                            </span>
                          )}
                        </>
                      ) : game.price_org ? (
                        `$${Number(game.price_org).toFixed(2)}`
                      ) : (
                        'Price N/A'
                      )}
                    </div>

                    <button
                      style={styles.secondarySmallBtn}
                      onClick={() => window.location.href = `/game/${game.app_id}`}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --------------------------------------- */}
        {/* WISHLIST — FULL IMPLEMENTATION */}
        {/* --------------------------------------- */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Wishlist</h2>

          {loadingWishlist ? (
            <div style={styles.placeholderBox}>Loading wishlist...</div>
          ) : wishlist.length === 0 ? (
            <div style={styles.placeholderBox}>Your wishlist is empty.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              {wishlist.map((game) => (
                <div key={game.app_id} style={styles.gameCard}>
                  <img
                    src={game.header_image || game.background || ''}
                    alt={game.name || 'Game'}
                    style={{ width: "100%", borderRadius: "10px", objectFit: "cover", height: 120 }}
                  />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{game.name || 'Untitled Game'}</h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
                      {game.price_final != null ? (
                        <>
                          <span style={{ color: '#111' }}>${Number(game.price_final).toFixed(2)}</span>
                          {game.price_org && Number(game.price_org) > Number(game.price_final) && (
                            <span style={{ textDecoration: 'line-through', marginLeft: 8, color: '#9ca3af' }}>
                              ${Number(game.price_org).toFixed(2)}
                            </span>
                          )}
                        </>
                      ) : game.price_org ? (
                        `$${Number(game.price_org).toFixed(2)}`
                      ) : (
                        'Price N/A'
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        style={styles.removeBtn}
                        onClick={async () => {
                          try {
                            await userService.removeFromWishlist(game.app_id);
                            setWishlist(prev => prev.filter(g => g.app_id !== game.app_id));
                          } catch (err) {
                            console.error('Failed to remove from wishlist', err);
                          }
                        }}
                      >
                        Remove
                      </button>

                      <button
                        style={styles.secondarySmallBtn}
                        onClick={() => window.location.href = `/game/${game.app_id}`}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --------------------------------------- */}
        {/* PURCHASE HISTORY */}
        {/* --------------------------------------- */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Purchase History</h2>
          <div style={styles.placeholderBox}>Coming soon...</div>
        </div>
      </div>
    </>
  );
};

export default Profile;

/* CSS-IN-JS STYLES */
const styles = {
  container: {
    padding: "40px 80px",
    backgroundColor: "#fafafa",
    minHeight: "100vh"
  },

  title: {
    fontSize: "2.4rem",
    fontWeight: "700",
    marginBottom: "30px",
    color: "#111"
  },

  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    marginBottom: "40px"
  },

  cardLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "20px"
  },

  avatarColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    minWidth: "100px"
  },

  avatarContainer: {
    width: "80px",
    height: "80px",
    background: "#e5e7eb",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  avatarIcon: {
    fontSize: "40px"
  },

  avatarName: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#111",
    textAlign: "center"
  },

  infoColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    justifyContent: "center"
  },

  email: {
    margin: "5px 0",
    fontSize: "1rem",
    color: "#555"
  },

  birthDate: {
    fontSize: "0.9rem",
    color: "#777"
  },

  role: {
    fontSize: "0.95rem",
    color: "#4b5563",
    fontWeight: 600
  },

  cardRight: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  editBtn: {
    padding: "10px 18px",
    background: "linear-gradient(90deg, #ef4444, #dc2626)",
    border: "none",
    color: "#fff",
    fontWeight: "600",
    borderRadius: "8px",
    cursor: "pointer"
  },

  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "1rem"
  },

  actionsRow: {
    display: "flex",
    gap: "10px",
    marginTop: "6px"
  },

  saveBtn: {
    padding: "10px 16px",
    background: "linear-gradient(90deg, #16a34a, #15803d)",
    border: "none",
    color: "#fff",
    borderRadius: "8px",
    cursor: "pointer"
  },

  cancelBtn: {
    padding: "10px 16px",
    background: "#ddd",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },

  section: {
    marginTop: "40px"
  },

  sectionTitle: {
    fontSize: "1.6rem",
    marginBottom: "16px"
  },

  placeholderBox: {
    background: "#fff",
    borderRadius: "12px",
    padding: "30px",
    textAlign: "center",
    color: "#777",
    fontSize: "1.1rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)"
  },

  // ---------------------------------------
  //  Wishlist styles
  // ---------------------------------------
  gameCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  removeBtn: {
    padding: "8px 12px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },

  secondarySmallBtn: {
    padding: "8px 12px",
    background: "#f3f4f6",
    color: "#111",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    cursor: "pointer"
  },

  errorMessage: {
    padding: "10px",
    background: "#fee2e2",
    color: "#dc2626",
    borderRadius: "8px",
    fontSize: "0.9rem",
    marginBottom: "10px",
    border: "1px solid #fecaca"
  },

  successMessage: {
    padding: "10px",
    background: "#d1fae5",
    color: "#059669",
    borderRadius: "8px",
    fontSize: "0.9rem",
    marginBottom: "10px",
    border: "1px solid #a7f3d0"
  }
};
