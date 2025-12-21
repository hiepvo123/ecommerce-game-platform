// backend/controllers/orderController.js

const queries = require('../db/helpers/queries');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get current user's orders with items (list)
 * GET /api/orders
 */
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await queries.orders.getUserOrdersWithItems(userId, {
      sortBy: 'created_at',
      order: 'DESC',
    });
    return sendSuccess(res, { orders }, 'Orders retrieved successfully');
  } catch (error) {
    console.error('Get orders error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get single order with items and billing address
 * GET /api/orders/:id
 */
const getMyOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id, 10);
    if (Number.isNaN(orderId)) {
      return sendError(res, 'Invalid order ID', 'VALIDATION_ERROR', 400);
    }

    const order = await queries.orders.getOrderWithItems(orderId);
    if (!order) {
      return sendError(res, 'Order not found', 'NOT_FOUND', 404);
    }
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && order.user_id !== userId) {
      return sendError(res, 'Access denied', 'ACCESS_DENIED', 403);
    }

    let billingAddress = null;
    if (order.billing_address_id) {
      try {
        billingAddress = await queries.users.getBillingAddressById(
          order.billing_address_id,
          userId
        );
      } catch (e) {
        // ignore address load errors; keep order response
      }
    }

    return sendSuccess(
      res,
      { order: { ...order, billing_address: billingAddress } },
      'Order retrieved successfully'
    );
  } catch (error) {
    console.error('Get order by id error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

module.exports = {
  getMyOrders,
  getMyOrderById,
};

