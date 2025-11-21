// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); 
const sessionMiddleware = require('./config/session');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://127.0.0.1:5500', // Live Server
    'http://localhost:5500',  // Live Server alternative
    null // For file:// protocol
  ],
  credentials: true, // Allow cookies to be sent
}));

// Body parser middleware (cho phép Express đọc JSON)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (must be before routes)
app.use(sessionMiddleware);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handler middleware (must be last)
app.use(errorHandler);


// Khởi động Server + kết nối DB
const startServer = async () => {
    try {
        // KẾT NỐI DATABASE
        await db.connectDB(); 

        // KHỞI ĐỘNG EXPRESS SERVER
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error("Cannot Activate Server:", err.message);
        process.exit(1);
    }
};

startServer();