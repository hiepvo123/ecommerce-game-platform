const bcrypt = require('bcrypt');
const queries = require('../db/helpers/queries');
const jwtService = require('../services/jwtService');
const GameModel = require('../models/GameModel');
const GameDescriptionModel = require('../models/GameDescriptionModel');
const UserModel = require('../models/UserModel');
const OrderModel = require('../models/OrderModel');


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

      // Tạo token JWT
      const token = jwtService.generateToken(user);

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


module.exports = {

  // CREATE GAME
  createGame: async (req, res) => {
    try {
      const gameData = req.body;

      if (!gameData.app_id || !gameData.name) {
        return res.status(400).json({ message: "app_id và name là bắt buộc" });
      }

      const existing = await GameModel.getGameById(gameData.app_id);
      if (existing) {
        return res.status(409).json({ message: "Game đã tồn tại" });
      }

      const newGame = await GameModel.createGame(gameData);
      return res.status(201).json(newGame);

    } catch (err) {
      console.error("Create Game Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  },

  //UPDATE GAME
  updateGame: async (req, res) => {
    try {
      const appId = parseInt(req.params.appId);

      const updated = await GameModel.updateGame(appId, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Không tìm thấy game để update" });
      }

      return res.json(updated);

    } catch (err) {
      console.error("Update Game Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  },

  // DELETE GAME
  deleteGame: async (req, res) => {
    try {
      const appId = parseInt(req.params.appId);

      const game = await GameModel.getGameById(appId);
      if (!game) {
        return res.status(404).json({ message: "Game không tồn tại" });
      }

      await GameModel.deleteGame(appId);
      return res.json({ message: "Xóa game thành công" });

    } catch (err) {
      console.error("Delete Game Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  },
};

module.exports = {
  // CREATE GAME DESCRIPTION
createGameDescription: async (req, res) => {
  try {
    const appId = parseInt(req.params.appId);

    const existing = await GameDescriptionModel.getDescriptionByAppId(appId);
    if (existing) {
      return res.status(409).json({ message: "Description already exists for this game" });
    }

    const desc = await GameDescriptionModel.createDescription(appId, req.body);
    return res.status(201).json(desc);

  } catch (err) {
    console.error("Create Description Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
},

  // UPDATE GAME DESCRIPTION
updateGameDescription: async (req, res) => {
  try {
    const appId = parseInt(req.params.appId);

    const existing = await GameDescriptionModel.getDescriptionByAppId(appId);
    if (!existing) {
      return res.status(404).json({ message: "Description not found" });
    }

    const updated = await GameDescriptionModel.updateDescription(appId, req.body);
    return res.json(updated);

  } catch (err) {
    console.error("Update Description Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
},

// DELETE GAME DESCRIPTION
deleteGameDescription: async (req, res) => {
  try {
    const appId = parseInt(req.params.appId);

    const existing = await GameDescriptionModel.getDescriptionByAppId(appId);
    if (!existing) {
      return res.status(404).json({ message: "Description not found" });
    }

    await GameDescriptionModel.deleteDescription(appId);
    return res.json({ message: "Game description deleted" });

  } catch (err) {
    console.error("Delete Description Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
},

// get all users
adminGetUsers: async (req, res) => {
  try {
    const users = await UserModel.getAllUsers();
    return res.json(users);

  } catch (err) {
    console.error("Get Users Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
},

// update user
adminUpdateUser: async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const user = await UserModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updated = await UserModel.updateUser(userId, req.body);
    return res.json(updated);

  } catch (err) {
    console.error("Update User Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
},

// delete user
adminDeleteUser: async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const user = await UserModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await UserModel.deleteUser(userId);
    return res.json({ message: "User deleted successfully" });

  } catch (err) {
    console.error("Delete User Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
},

// update order status
adminUpdateOrderStatus: async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;

    const validStatuses = ["pending", "paid", "canceled", "refunded", "failed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
        allowed: validStatuses
      });
    }

    const order = await OrderModel.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const updated = await OrderModel.updateOrderStatus(orderId, status);

    return res.json({
      message: "Order status updated",
      order: updated
    });

  } catch (err) {
    console.error("Update Order Status Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
},

};