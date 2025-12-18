// backend/controllers/gameController.js

const queries = require('../db/helpers/queries');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get recommended games based on user preferences
 * GET /api/games/recommended
 */
const getRecommendedGames = async (req, res) => {
  try {
    // Get user from session (optional - can be public with defaults)
    let userId = null;
    
    // Check if user is authenticated via session
    if (req.session && req.session.user) {
      userId = req.session.user.id;
    } else if (req.user) {
      userId = req.user.id;
    } else if (req.headers['x-session-id'] && req.sessionStore) {
      // Try to get user from session header (for cross-origin workaround)
      try {
        const sessionData = await new Promise((resolve, reject) => {
          req.sessionStore.get(req.headers['x-session-id'], (err, session) => {
            if (err) reject(err);
            else resolve(session);
          });
        });
        if (sessionData && sessionData.user) {
          userId = sessionData.user.id;
        }
      } catch (error) {
        // No session found, continue without user
      }
    }

    const { limit = 20, offset = 0, minMatches = 15, sortBy = 'recommendations_total', order = 'DESC' } = req.query;
    
    let games;
    if (userId) {
      // Get personalized recommendations
      games = await queries.games.getRecommendedGames(userId, {
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        minMatches: parseInt(minMatches, 10),
        sortBy,
        order: order.toUpperCase()
      });
    } else {
      // No user - return top games by recommendations
      games = await queries.games.getAllGames({
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        sortBy,
        order: order.toUpperCase()
      });
    }

    return sendSuccess(res, { 
      games,
      count: games.length,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    }, 'Recommended games retrieved successfully');

  } catch (error) {
    console.error('Get recommended games error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get all games with pagination and filters
 * GET /api/games
 */
const getGames = async (req, res) => {
  try {
    const { limit = 20, offset = 0, sortBy = 'recommendations_total', order = 'DESC', platform, minPrice, maxPrice, hasDiscount, languageId } = req.query;
    
    let userId = null;
    if (req.session && req.session.user) {
      userId = req.session.user.id;
    } else if (req.user) {
      userId = req.user.id;
    }

    const filters = {};
    if (platform) filters.platform = platform;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (hasDiscount === 'true') filters.hasDiscount = true;
    if (languageId) filters.languageId = languageId;
    if (userId) filters.excludeOwnedUserId = userId;

    const games = await queries.games.getGamesByFilter(filters, {
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
    }, 'Games retrieved successfully');

  } catch (error) {
    console.error('Get games error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get game by ID with full details
 * GET /api/games/:appId
 */
const getGameById = async (req, res) => {
  try {
    const appId = parseInt(req.params.appId, 10);
    if (isNaN(appId)) {
      return sendError(res, 'Invalid game ID', 'VALIDATION_ERROR', 400);
    }

    const game = await queries.games.getGameWithDetails(appId);
    
    if (!game) {
      return sendError(res, 'Game not found', 'NOT_FOUND', 404);
    }

    return sendSuccess(res, { game }, 'Game details retrieved successfully');

  } catch (error) {
    console.error('Get game error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Fast autocomplete search for dropdown suggestions
 * GET /api/games/search/autocomplete?q=...
 */
const searchGamesAutocomplete = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || q.trim() === '') {
      return sendSuccess(res, { games: [] }, 'Autocomplete results');
    }

    const games = await queries.games.searchGamesAutocomplete(q.trim(), {
      limit: parseInt(limit, 10),
      offset: 0
    });

    return sendSuccess(res, {
      games,
      count: games.length,
      query: q.trim()
    }, 'Autocomplete results retrieved successfully');

  } catch (error) {
    console.error('Autocomplete search error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Search games (full-text search for search page)
 * GET /api/games/search?q=...
 */
const searchGames = async (req, res) => {
  try {
    // Default to relevance for search, but allow override
    const { q, limit = 20, offset = 0, sortBy = 'relevance', order = 'DESC' } = req.query;

    if (!q || q.trim() === '') {
      return sendError(res, 'Search query is required', 'VALIDATION_ERROR', 400);
    }

    const games = await queries.games.searchGames(q.trim(), {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      sortBy, // 'relevance' or other field - query handles it
      order: order.toUpperCase()
    });

    return sendSuccess(res, {
      games,
      count: games.length,
      query: q.trim(),
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    }, 'Search results retrieved successfully');

  } catch (error) {
    console.error('Search games error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get featured games (top by recommendations)
 * GET /api/games/featured
 */
const getFeaturedGames = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    let userId = null;
    if (req.session && req.session.user) {
      userId = req.session.user.id;
    } else if (req.user) {
      userId = req.user.id;
    }

    const games = await queries.games.getAllGames({
      limit: parseInt(limit, 10),
      offset: 0,
      sortBy: 'recommendations_total',
      order: 'DESC',
      excludeOwnedUserId: userId || undefined,
    });

    return sendSuccess(res, { games }, 'Featured games retrieved successfully');

  } catch (error) {
    console.error('Get featured games error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get games by genre
 * GET /api/games/genre/:genreId
 */
const getGamesByGenre = async (req, res) => {
  try {
    const genreId = parseInt(req.params.genreId, 10);
    if (isNaN(genreId)) {
      return sendError(res, 'Invalid genre ID', 'VALIDATION_ERROR', 400);
    }

    const { limit = 20, offset = 0, sortBy = 'recommendations_total', order = 'DESC', languageId } = req.query;

    let userId = null;
    if (req.session && req.session.user) {
      userId = req.session.user.id;
    } else if (req.user) {
      userId = req.user.id;
    }

    const games = await queries.games.getGamesByGenre(genreId, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      sortBy,
      order: order.toUpperCase(),
      languageId: languageId || undefined,
      excludeOwnedUserId: userId || undefined,
    });

    return sendSuccess(res, {
      games,
      count: games.length,
      genreId,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    }, 'Games by genre retrieved successfully');

  } catch (error) {
    console.error('Get games by genre error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get games by category
 * GET /api/games/category/:categoryId
 */
const getGamesByCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId, 10);
    if (isNaN(categoryId)) {
      return sendError(res, 'Invalid category ID', 'VALIDATION_ERROR', 400);
    }

    const { limit = 20, offset = 0, sortBy = 'recommendations_total', order = 'DESC', languageId } = req.query;

    let userId = null;
    if (req.session && req.session.user) {
      userId = req.session.user.id;
    } else if (req.user) {
      userId = req.user.id;
    }

    const games = await queries.games.getGamesByCategory(categoryId, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      sortBy,
      order: order.toUpperCase(),
      languageId: languageId || undefined,
      excludeOwnedUserId: userId || undefined,
    });

    return sendSuccess(res, {
      games,
      count: games.length,
      categoryId,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    }, 'Games by category retrieved successfully');

  } catch (error) {
    console.error('Get games by category error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get discounted games
 * GET /api/games/discounted
 */
const getDiscountedGames = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const games = await queries.games.getDiscountedGames({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return sendSuccess(res, {
      games,
      count: games.length,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    }, 'Discounted games retrieved successfully');

  } catch (error) {
    console.error('Get discounted games error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get newest games by release date
 * GET /api/games/newest
 */
const getNewestGames = async (req, res) => {
  try {
    const { limit = 20, offset = 0, platform, genreId, categoryId } = req.query;

    const games = await queries.games.getNewestGames({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      platform,
      genreId,
      categoryId
    });

    return sendSuccess(res, {
      games,
      count: games.length,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    }, 'Newest games retrieved successfully');

  } catch (error) {
    console.error('Get newest games error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get reviews for a specific game
 * GET /api/games/:appId/reviews
 */
const getGameReviews = async (req, res) => {
  try {
    const appId = parseInt(req.params.appId, 10);
    if (Number.isNaN(appId)) {
      return sendError(res, 'Invalid game ID', 'VALIDATION_ERROR', 400);
    }

    const { limit = 20, offset = 0, sortBy = 'id', order = 'DESC' } = req.query;

    const reviews = await queries.reviews.getReviewsByGame(appId, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      sortBy,
      order: String(order || 'DESC').toUpperCase(),
    });

    // Optional: include basic stats if available
    let stats = null;
    try {
      stats = await queries.reviews.getReviewStats(appId);
    } catch (e) {
      // stats are optional; ignore errors
    }

    return sendSuccess(
      res,
      {
        reviews,
        count: Array.isArray(reviews) ? reviews.length : 0,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        stats,
      },
      'Game reviews retrieved successfully'
    );
  } catch (error) {
    console.error('Get game reviews error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get the current user's review for a specific game
 * GET /api/games/:appId/review/me
 * Requires authentication (middleware)
 */
const getMyGameReview = async (req, res) => {
  try {
    const appId = parseInt(req.params.appId, 10);
    if (Number.isNaN(appId)) {
      return sendError(res, 'Invalid game ID', 'VALIDATION_ERROR', 400);
    }

    const userId = req.user && req.user.id;
    if (!userId) {
      return sendError(res, 'Not authenticated', 'NOT_AUTHENTICATED', 401);
    }

    const review = await queries.reviews.getReviewByUserAndGame(userId, appId);

    return sendSuccess(
      res,
      { review: review || null },
      'User review retrieved successfully'
    );
  } catch (error) {
    console.error('Get my game review error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

module.exports = {
  searchGamesAutocomplete,
  getRecommendedGames,
  getGames,
  getGameById,
  searchGames,
  getFeaturedGames,
  getGamesByGenre,
  getGamesByCategory,
  getDiscountedGames,
  getNewestGames,
   getGameReviews,
   getMyGameReview,
};

