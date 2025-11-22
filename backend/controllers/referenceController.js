// backend/controllers/referenceController.js

const queries = require('../db/helpers/queries');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get all languages
 * GET /api/reference/languages
 */
const getLanguages = async (req, res) => {
  try {
    const languages = await queries.languages.getAllLanguages();
    return sendSuccess(res, { languages }, 'Languages retrieved successfully');
  } catch (error) {
    console.error('Get languages error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get language by ID
 * GET /api/reference/languages/:id
 */
const getLanguageById = async (req, res) => {
  try {
    const languageId = parseInt(req.params.id, 10);
    if (isNaN(languageId)) {
      return sendError(res, 'Invalid language ID', 'VALIDATION_ERROR', 400);
    }

    const language = await queries.languages.getLanguageById(languageId);
    
    if (!language) {
      return sendError(res, 'Language not found', 'NOT_FOUND', 404);
    }

    return sendSuccess(res, { language }, 'Language retrieved successfully');
  } catch (error) {
    console.error('Get language error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get all categories
 * GET /api/reference/categories
 */
const getCategories = async (req, res) => {
  try {
    const categories = await queries.categories.getAllCategories();
    return sendSuccess(res, { categories }, 'Categories retrieved successfully');
  } catch (error) {
    console.error('Get categories error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get category by ID
 * GET /api/reference/categories/:id
 */
const getCategoryById = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    if (isNaN(categoryId)) {
      return sendError(res, 'Invalid category ID', 'VALIDATION_ERROR', 400);
    }

    const category = await queries.categories.getCategoryById(categoryId);
    
    if (!category) {
      return sendError(res, 'Category not found', 'NOT_FOUND', 404);
    }

    return sendSuccess(res, { category }, 'Category retrieved successfully');
  } catch (error) {
    console.error('Get category error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get all genres
 * GET /api/reference/genres
 */
const getGenres = async (req, res) => {
  try {
    const genres = await queries.genres.getAllGenres();
    return sendSuccess(res, { genres }, 'Genres retrieved successfully');
  } catch (error) {
    console.error('Get genres error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get genre by ID
 * GET /api/reference/genres/:id
 */
const getGenreById = async (req, res) => {
  try {
    const genreId = parseInt(req.params.id, 10);
    if (isNaN(genreId)) {
      return sendError(res, 'Invalid genre ID', 'VALIDATION_ERROR', 400);
    }

    const genre = await queries.genres.getGenreById(genreId);
    
    if (!genre) {
      return sendError(res, 'Genre not found', 'NOT_FOUND', 404);
    }

    return sendSuccess(res, { genre }, 'Genre retrieved successfully');
  } catch (error) {
    console.error('Get genre error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

module.exports = {
  getLanguages,
  getLanguageById,
  getCategories,
  getCategoryById,
  getGenres,
  getGenreById,
};

