// backend/controllers/wishlistController.js

const queries = require('../db/helpers/queries');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get user wishlist
 * GET /api/wishlist
 */
const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, sortBy = 'added_at', order = 'DESC' } = req.query;

    const games = await queries.library.getUserWishlist(userId, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      sortBy,
      order: order.toUpperCase()
    });

    return sendSuccess(res, {
      games,
      count: games.length,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    }, 'Wishlist retrieved successfully');

  } catch (error) {
    console.error('Get wishlist error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Add game to wishlist
 * POST /api/wishlist
 */
const addToWishlist = async (req, res) => {
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

    // Check if already in wishlist
    const isInWishlist = await queries.library.isInWishlist(userId, parseInt(appId, 10));
    if (isInWishlist) {
      return sendError(res, 'Game is already in wishlist', 'ALREADY_EXISTS', 409);
    }

    // Add to wishlist
    const wishlistItem = await queries.library.addToWishlist(userId, parseInt(appId, 10));

    return sendSuccess(res, {
      wishlistItem,
      game: {
        app_id: game.app_id,
        name: game.name
      }
    }, 'Game added to wishlist successfully');

  } catch (error) {
    console.error('Add to wishlist error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Remove game from wishlist
 * DELETE /api/wishlist/:appId
 */
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const appId = parseInt(req.params.appId, 10);

    if (isNaN(appId)) {
      return sendError(res, 'Invalid game ID', 'VALIDATION_ERROR', 400);
    }

    // Check if game is in wishlist
    const isInWishlist = await queries.library.isInWishlist(userId, appId);
    if (!isInWishlist) {
      return sendError(res, 'Game is not in wishlist', 'NOT_FOUND', 404);
    }

    // Remove from wishlist
    await queries.library.removeFromWishlist(userId, appId);

    return sendSuccess(res, {
      appId
    }, 'Game removed from wishlist successfully');

  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Check if game is in wishlist
 * GET /api/wishlist/check/:appId
 */
const checkWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const appId = parseInt(req.params.appId, 10);

    if (isNaN(appId)) {
      return sendError(res, 'Invalid game ID', 'VALIDATION_ERROR', 400);
    }

    const isInWishlist = await queries.library.isInWishlist(userId, appId);

    return sendSuccess(res, {
      appId,
      isInWishlist
    }, 'Wishlist status retrieved successfully');

  } catch (error) {
    console.error('Check wishlist error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
};

