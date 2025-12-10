const bcrypt = require('bcrypt');
const queries = require('../db/helpers/queries');

module.exports = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Lấy user bằng email
      const user = await queries.users.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Kiểm tra role
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Not an admin" });
      }

      // So sánh mật khẩu
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }


      res.json({
        message: "Admin login successful",
        token,
        admin: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        }
      });

    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
};
