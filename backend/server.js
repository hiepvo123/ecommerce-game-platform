// backend/server.js

//require('dotenv').config({ path: '../.env' }); // Đường dẫn .env
require('dotenv').config();
const express = require('express');
const db = require('./db'); 
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (cho phép Express đọc JSON)
app.use(express.json());

// Định tuyến API cho Authentication - Mọi request tới /api/auth/... sẽ được xử lý bởi authRoutes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);


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