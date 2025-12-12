// backend/controllers/wishlistController.js

const queries = require('../db/helpers/queries');
const { sendSuccess, sendError } = require('../utils/response');

const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, sortBy = 'added_at', order = 'DESC' } = req.query;

    const games = await queries.wishlist.getUserWishlist(userId, {
      limit: Number(limit),
      offset: Number(offset),
      sortBy,
      order: order.toUpperCase()
    });

    return sendSuccess(res, {
      games,
      count: Array.isArray(games) ? games.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    }, 'Wishlist retrieved successfully');

  } catch (err) {
    console.error('Get wishlist error:', err);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { appId } = req.body;

    if (!appId) return sendError(res, 'appId required', 'VALIDATION_ERROR', 400);

    const game = await queries.games.getGameById(Number(appId));
    if (!game) return sendError(res, 'Game not found', 'NOT_FOUND', 404);

    const exists = await queries.wishlist.isInWishlist(userId, Number(appId));
    if (exists) return sendError(res, 'Already in wishlist', 'ALREADY_EXISTS', 409);

    const wishlistItem = await queries.wishlist.addToWishlist(userId, Number(appId));

    return sendSuccess(res, { wishlistItem, game }, 'Added to wishlist');

  } catch (err) {
    console.error('Add wishlist error:', err);
    return sendError(res, 'Internal error', 'INTERNAL_ERROR', 500);
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const appId = Number(req.params.appId);

    if (isNaN(appId)) return sendError(res, 'Invalid appId', 'VALIDATION_ERROR', 400);

    const exists = await queries.wishlist.isInWishlist(userId, appId);
    if (!exists) return sendError(res, 'Not found in wishlist', 'NOT_FOUND', 404);

    const removed = await queries.wishlist.removeFromWishlist(userId, appId);
    if (!removed) return sendError(res, 'Remove failed', 'INTERNAL_ERROR', 500);

    return sendSuccess(res, { appId }, 'Removed');

  } catch (err) {
    console.error('Remove wishlist error:', err);
    return sendError(res, 'Internal error', 'INTERNAL_ERROR', 500);
  }
};

const checkWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const appId = Number(req.params.appId);

    if (isNaN(appId)) return sendError(res, 'Invalid id', 'VALIDATION_ERROR', 400);

    const isInWishlist = await queries.wishlist.isInWishlist(userId, appId);

    return sendSuccess(res, { appId, isInWishlist }, 'Status retrieved');

  } catch (err) {
    console.error('Check wishlist error:', err);
    return sendError(res, 'Internal error', 'INTERNAL_ERROR', 500);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
};
