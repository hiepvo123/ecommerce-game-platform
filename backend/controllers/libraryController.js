// backend/controllers/libraryController.js

const queries = require('../db/helpers/queries');
const { sendSuccess, sendError } = require('../utils/response');

const getLibrary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, sortBy = 'added_at', order = 'DESC' } = req.query;

    const games = await queries.library.getUserLibrary(userId, {
      limit: Number(limit),
      offset: Number(offset),
      sortBy,
      order: String(order || 'DESC').toUpperCase(),
    });

    return sendSuccess(
      res,
      {
        games,
        count: Array.isArray(games) ? games.length : 0,
        limit: Number(limit),
        offset: Number(offset),
      },
      'Library retrieved successfully'
    );
  } catch (err) {
    console.error('Get library error:', err);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Create or update a review for a game in the user's library
 * POST /api/library/review
 */
const addOrUpdateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { appId, isRecommended, reviewText } = req.body;

    // Basic validation
    const parsedAppId = Number(appId);
    if (!parsedAppId || Number.isNaN(parsedAppId)) {
      return sendError(res, 'Invalid appId', 'VALIDATION_ERROR', 400);
    }

    if (typeof isRecommended !== 'boolean') {
      return sendError(res, 'isRecommended must be boolean', 'VALIDATION_ERROR', 400);
    }

    // Ensure game is in user's library
    const isOwned = await queries.library.isInLibrary(userId, parsedAppId);
    if (!isOwned) {
      return sendError(
        res,
        'You can only review games that are in your library',
        'FORBIDDEN',
        403
      );
    }

    // Check if review already exists for this user + game
    const existing = await queries.reviews.getReviewByUserAndGame(userId, parsedAppId);

    if (existing) {
      // Update existing review
      const updated = await queries.reviews.updateReview(existing.id, {
        review_text: reviewText ?? null,
        is_recommended: isRecommended,
      });

      return sendSuccess(
        res,
        { review: updated },
        'Review updated successfully',
        200
      );
    }

    // Create new review
    const created = await queries.reviews.createReview({
      user_id: userId,
      app_id: parsedAppId,
      review_text: reviewText ?? null,
      is_recommended: isRecommended,
    });

    return sendSuccess(
      res,
      { review: created },
      'Review created successfully',
      201
    );
  } catch (err) {
    console.error('Add/update review error:', err);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

module.exports = {
  getLibrary,
  addOrUpdateReview,
};


