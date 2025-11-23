const { queryOne } = require('../db/helpers/queryUtils');

module.exports = {
  getOrderById: async (orderId) => {
    return await queryOne(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  },

  updateOrderStatus: async (orderId, status) => {
    return await queryOne(
      `
      UPDATE orders
      SET order_status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [status, orderId]
    );
  }
};
