// frontend/src/pages/Profile.jsx
import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar.jsx';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
  });

  // ------------------
  //  NEW: WISHLIST STATES (implemented)
  // ------------------
  const [wishlist, setWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  // ---------------------

  // ⭐ FIX HERE: mapper to convert backend snake_case → camelCase
  const mapWishlistItem = (raw) => ({
    app_id: raw.app_id,
    name: raw.name,
    title: raw.title,
    price_final: raw.price_final,
    price_org: raw.price_org,
    discount_percent: raw.discount_percent,

    header_image: raw.header_image,
    background: raw.background,
    categories: raw.categories,
    genres: raw.genres,

    wishlist_added_at: raw.wishlist_added_at
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile();
        // backend returns { profile: { ... } } or profile object depending on impl.
        const profileData = data?.profile ?? data;
        setProfile(profileData);
        setFormData({
          username: profileData?.username || '',
          email: profileData?.email || ''
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
        const data = await userService.getWishlist();
        // backend returns structure like: { games: [...], count, ... }
        let gamesRaw = [];
        if (Array.isArray(data)) gamesRaw = data;
        else if (Array.isArray(data?.games)) gamesRaw = data.games;
        else if (Array.isArray(data?.data)) gamesRaw = data.data;
        else if (Array.isArray(data?.profile?.wishlist)) gamesRaw = data.profile.wishlist;
        else gamesRaw = [];

        // ⭐ FIX HERE: map each item to proper keys
        const games = gamesRaw.map(mapWishlistItem);

        setWishlist(games);
      } catch (err) {
        console.error("Failed to load wishlist", err);
      } finally {
        setLoadingWishlist(false);
      }
    };
    // ---------------------

    fetchProfile();
    fetchWishlist();
  }, []);

  const handleEditToggle = () => {
    setEditing(!editing);
  };

  const handleSave = async () => {
    try {
      const updatedData = await userService.updateProfile(formData);

      // backend may return updated object inside .profile or raw object
      const updatedProfile = updatedData?.profile ?? updatedData;

      setProfile(updatedProfile);

      setFormData({
        username: updatedProfile.username,
        email: updatedProfile.email
      });

      setUser(updatedProfile);

      setEditing(false);
    } catch (e) {
      console.error("Error updating profile:", e);
    }
  };

  if (loading) return <div>Loading...</div>;

  const displayName =
    profile?.username ||
    `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() ||
    (profile?.email ? profile.email.split('@')[0] : 'User');

  const joinedDate = profile?.createdAt ? String(profile.createdAt).slice(0, 10) : '';


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
              <p style={styles.joined}>Joined: {joinedDate}</p>
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
                <input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={styles.input}
                />
                <div style={styles.actionsRow}>
                  <button style={styles.saveBtn} onClick={handleSave}>Save</button>
                  <button style={styles.cancelBtn} onClick={handleEditToggle}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* --------------------------------------- */}
        {/* OWNED GAMES */}
        {/* --------------------------------------- */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Owned Games</h2>
          <div style={styles.placeholderBox}>Coming soon...</div>
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
                    src={game.header_image || game.background || game.thumbnail || ''}
                    alt={game.name || game.title || 'Game'}
                    style={{ width: "100%", borderRadius: "10px", objectFit: "cover", height: 120 }}
                  />
                  <h4 style={{ margin: 0 }}>{game.name || game.title}</h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>
                      {game.price_final != null ? `$${Number(game.price_final).toFixed(2)}` : (game.price_org ? `$${Number(game.price_org).toFixed(2)}` : '')}
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
                        onClick={() => window.location.href = `/games/${game.app_id}`}
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

  joined: {
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
  }
};
