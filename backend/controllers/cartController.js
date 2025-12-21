// backend/controllers/cartController.js

const queries = require('../db/helpers/queries');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get user cart with items
 * GET /api/cart
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await queries.carts.getCartWithItems(userId);

    if (!cart) {
      // Return empty cart structure
      return sendSuccess(res, {
        cart: {
          id: null,
          user_id: userId,
          total_price: 0,
          items: []
        }
      }, 'Cart retrieved successfully');
    }

    return sendSuccess(res, { cart }, 'Cart retrieved successfully');

  } catch (error) {
    console.error('Get cart error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Add game to cart
 * POST /api/cart/items
 */
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { appId } = req.body;

    if (!appId) {
      return sendError(res, 'Game ID (appId) is required', 'VALIDATION_ERROR', 400);
    }

    // Check if game exists
    const game = await queries.games.getGameById(parseInt(appId, 10));
    if (!game) {
      return sendError(res, 'Game not found', 'NOT_FOUND', 404);
    }

    // Check if user already owns the game
    const isInLibrary = await queries.library.isInLibrary(userId, parseInt(appId, 10));
    if (isInLibrary) {
      return sendError(res, 'You already own this game', 'ALREADY_OWNED', 409);
    }

    // Get or create cart
    const cart = await queries.carts.getOrCreateCart(userId);

    // Check if item already in cart
    const existingItem = await queries.carts.addItemToCart(cart.id, parseInt(appId, 10));

    // Get updated cart with items
    const updatedCart = await queries.carts.getCartWithItems(userId);

    return sendSuccess(res, {
      cart: updatedCart,
      item: {
        app_id: game.app_id,
        name: game.name
      }
    }, 'Game added to cart successfully');

  } catch (error) {
    console.error('Add to cart error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Remove game from cart
 * DELETE /api/cart/items/:appId
 */
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const appId = parseInt(req.params.appId, 10);

    if (isNaN(appId)) {
      return sendError(res, 'Invalid game ID', 'VALIDATION_ERROR', 400);
    }

    // Get user cart
    const cart = await queries.carts.getCartByUserId(userId);
    if (!cart) {
      return sendError(res, 'Cart not found', 'NOT_FOUND', 404);
    }

    // Remove item
    await queries.carts.removeItemFromCart(cart.id, appId);

    // Get updated cart
    const updatedCart = await queries.carts.getCartWithItems(userId);

    return sendSuccess(res, {
      cart: updatedCart,
      appId
    }, 'Game removed from cart successfully');

  } catch (error) {
    console.error('Remove from cart error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Clear cart
 * DELETE /api/cart
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user cart
    const cart = await queries.carts.getCartByUserId(userId);
    if (!cart) {
      return sendError(res, 'Cart not found', 'NOT_FOUND', 404);
    }

    // Clear cart
    await queries.carts.clearCart(cart.id);

    // Get updated cart
    const updatedCart = await queries.carts.getCartWithItems(userId);

    return sendSuccess(res, {
      cart: updatedCart
    }, 'Cart cleared successfully');

  } catch (error) {
    console.error('Clear cart error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get cart item count
 * GET /api/cart/count
 */
const getCartCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await queries.carts.getCartWithItems(userId);

    const itemCount = cart ? (cart.items?.length || 0) : 0;

    return sendSuccess(res, {
      count: itemCount
    }, 'Cart count retrieved successfully');

  } catch (error) {
    console.error('Get cart count error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Validate coupon and calculate discount (without creating order)
 * POST /api/cart/validate-coupon
 */
const validateCoupon = async (req, res) => {
  try {
    const userId = req.user.id;
    const { couponCode, subtotal } = req.body || {};

    if (!couponCode || !couponCode.trim()) {
      return sendSuccess(res, { valid: false, discount: 0, message: 'No coupon code provided' }, 'Coupon validation');
    }

    const code = couponCode.trim().toUpperCase();
    const subtotalNum = parseFloat(subtotal) || 0;

    if (subtotalNum <= 0) {
      return sendSuccess(res, { valid: false, discount: 0, message: 'Subtotal must be greater than 0' }, 'Coupon validation');
    }

    // Get coupon by code (case-insensitive)
    const coupon = await queries.coupons.getCouponByCode(code);
    if (!coupon) {
      return sendSuccess(res, { valid: false, discount: 0, message: 'Invalid coupon code' }, 'Coupon validation');
    }

    // Check if user already used this coupon
    const hasUsed = await queries.coupons.hasUserUsedCoupon(userId, coupon.id);
    if (hasUsed) {
      return sendSuccess(res, { valid: false, discount: 0, message: 'Coupon already used' }, 'Coupon validation');
    }

    // Calculate discount
    let discount = queries.coupons.calculateDiscount(coupon, subtotalNum);
    if (discount < 0) discount = 0;
    if (discount > subtotalNum) discount = subtotalNum;

    return sendSuccess(
      res,
      {
        valid: true,
        discount,
        couponCode: coupon.code,
        discountType: coupon.discount_type,
        discountValue: coupon.value,
      },
      'Coupon validated successfully'
    );
  } catch (error) {
    console.error('Validate coupon error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Checkout: create order from current cart (with optional coupon)
 * POST /api/cart/checkout
 * Creates a pending order (payment not captured here).
 */
const checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { couponCode, billingAddressId, appIds } = req.body || {};
    const appIdsList = Array.isArray(appIds) ? appIds : null;

    if (Array.isArray(appIdsList) && appIdsList.length === 0) {
      return sendError(res, 'Please select at least one game', 'CART_SELECTION_EMPTY', 400);
    }

    try {
      // Create order as pending; payment creation now handled separately.
      const order = await queries.orders.createOrderFromCart(userId, {
        discount_code: couponCode || null,
        billing_address_id: billingAddressId || null,
        order_status: 'pending',
        app_ids: appIdsList,
      });

      // Fetch order with items for confirmation payload
      const orderWithItems = await queries.orders.getOrderWithItems(order.id);

      return sendSuccess(
        res,
        { order: orderWithItems },
        'Order created (pending) from cart'
      );
    } catch (err) {
      if (err.message === 'Cart not found' || err.message === 'Cart is empty') {
        return sendError(res, 'Your cart is empty', 'CART_EMPTY', 400);
      }
      if (err.message === 'CART_SELECTION_EMPTY') {
        return sendError(res, 'Please select at least one game', 'CART_SELECTION_EMPTY', 400);
      }
      if (err.message === 'CART_SELECTION_INVALID') {
        return sendError(res, 'Some selected games are not in your cart', 'CART_SELECTION_INVALID', 400);
      }
      if (err.message === 'INVALID_COUPON') {
        return sendError(res, 'Invalid coupon code', 'INVALID_COUPON', 400);
      }
      if (err.message === 'COUPON_ALREADY_USED') {
        return sendError(res, 'Coupon already used', 'COUPON_ALREADY_USED', 400);
      }

      console.error('Checkout createOrderFromCart error:', err);
      return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
    }
  } catch (error) {
    console.error('Checkout error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  getCartCount,
  validateCoupon,
  checkout,
};

