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

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  getCartCount,
};

