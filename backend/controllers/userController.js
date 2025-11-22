// backend/controllers/userController.js

const queries = require('../db/helpers/queries');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Get current user from request (set by auth middleware)
 */
const getCurrentUser = (req) => {
  // User is set by requireAuth middleware
  return req.user || req.session.user;
};

/**
 * Get user profile
 * GET /api/user/profile
 */
const getProfile = async (req, res) => {
  try {
    const user = getCurrentUser(req);

    const profile = await queries.users.getUserProfile(user.id);
    
    return sendSuccess(res, {
      profile: profile || {
        user_id: user.id,
        prefer_lang_ids: null,
        prefer_genre_ids: null,
        prefer_cate_ids: null,
        prefer_platforms: null
      }
    }, 'Profile retrieved successfully');

  } catch (error) {
    console.error('Get profile error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Create or update user profile
 * PUT /api/user/profile
 */
const updateProfile = async (req, res) => {
  try {
    const user = getCurrentUser(req);

    const { preferLangIds, preferGenreIds, preferCateIds, preferPlatforms } = req.body;

    // Validate arrays
    const prefer_lang_ids = Array.isArray(preferLangIds) ? preferLangIds : null;
    const prefer_genre_ids = Array.isArray(preferGenreIds) ? preferGenreIds : null;
    const prefer_cate_ids = Array.isArray(preferCateIds) ? preferCateIds : null;
    const prefer_platforms = Array.isArray(preferPlatforms) ? preferPlatforms : null;

    // Validate platforms (should be: windows, mac, linux)
    if (prefer_platforms) {
      const validPlatforms = ['windows', 'mac', 'linux'];
      const invalidPlatforms = prefer_platforms.filter(p => !validPlatforms.includes(p));
      if (invalidPlatforms.length > 0) {
        return sendError(res, `Invalid platforms: ${invalidPlatforms.join(', ')}. Valid platforms are: windows, mac, linux`, 'VALIDATION_ERROR', 400);
      }
    }

    const profile = await queries.users.upsertUserProfile(user.id, {
      prefer_lang_ids: prefer_lang_ids,
      prefer_genre_ids: prefer_genre_ids,
      prefer_cate_ids: prefer_cate_ids,
      prefer_platforms: prefer_platforms
    });

    return sendSuccess(res, { profile }, 'Profile updated successfully');

  } catch (error) {
    console.error('Update profile error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get user billing addresses
 * GET /api/user/billing-addresses
 */
const getBillingAddresses = async (req, res) => {
  try {
    const user = getCurrentUser(req);

    const addresses = await queries.users.getUserBillingAddresses(user.id);
    
    return sendSuccess(res, { addresses }, 'Billing addresses retrieved successfully');

  } catch (error) {
    console.error('Get billing addresses error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Get billing address by ID
 * GET /api/user/billing-addresses/:id
 */
const getBillingAddressById = async (req, res) => {
  try {
    const user = getCurrentUser(req);

    const addressId = parseInt(req.params.id, 10);
    if (isNaN(addressId)) {
      return sendError(res, 'Invalid address ID', 'VALIDATION_ERROR', 400);
    }

    const address = await queries.users.getBillingAddressById(addressId, user.id);
    
    if (!address) {
      return sendError(res, 'Billing address not found', 'NOT_FOUND', 404);
    }

    return sendSuccess(res, { address }, 'Billing address retrieved successfully');

  } catch (error) {
    console.error('Get billing address error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Create billing address
 * POST /api/user/billing-addresses
 */
const createBillingAddress = async (req, res) => {
  try {
    const user = getCurrentUser(req);

    const { fullName, line1, line2, city, state, postalCode, country } = req.body;

    // Validation
    if (!fullName || !line1 || !city || !country) {
      return sendError(res, 'Full name, line1, city, and country are required', 'VALIDATION_ERROR', 400);
    }

    const address = await queries.users.createBillingAddress({
      user_id: user.id,
      full_name: fullName,
      line1: line1,
      line2: line2 || null,
      city: city,
      state: state || null,
      postal_code: postalCode || null,
      country: country
    });

    return sendSuccess(res, { address }, 'Billing address created successfully', 201);

  } catch (error) {
    console.error('Create billing address error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Update billing address
 * PUT /api/user/billing-addresses/:id
 */
const updateBillingAddress = async (req, res) => {
  try {
    const user = getCurrentUser(req);

    const addressId = parseInt(req.params.id, 10);
    if (isNaN(addressId)) {
      return sendError(res, 'Invalid address ID', 'VALIDATION_ERROR', 400);
    }

    const { fullName, line1, line2, city, state, postalCode, country } = req.body;

    // Validation
    if (!fullName || !line1 || !city || !country) {
      return sendError(res, 'Full name, line1, city, and country are required', 'VALIDATION_ERROR', 400);
    }

    // Check if address exists and belongs to user
    const existingAddress = await queries.users.getBillingAddressById(addressId, user.id);
    if (!existingAddress) {
      return sendError(res, 'Billing address not found', 'NOT_FOUND', 404);
    }

    const address = await queries.users.updateBillingAddress(addressId, user.id, {
      full_name: fullName,
      line1: line1,
      line2: line2 || null,
      city: city,
      state: state || null,
      postal_code: postalCode || null,
      country: country
    });

    return sendSuccess(res, { address }, 'Billing address updated successfully');

  } catch (error) {
    console.error('Update billing address error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

/**
 * Delete billing address
 * DELETE /api/user/billing-addresses/:id
 */
const deleteBillingAddress = async (req, res) => {
  try {
    const user = getCurrentUser(req);

    const addressId = parseInt(req.params.id, 10);
    if (isNaN(addressId)) {
      return sendError(res, 'Invalid address ID', 'VALIDATION_ERROR', 400);
    }

    const deleted = await queries.users.deleteBillingAddress(addressId, user.id);
    
    if (!deleted) {
      return sendError(res, 'Billing address not found', 'NOT_FOUND', 404);
    }

    return sendSuccess(res, null, 'Billing address deleted successfully');

  } catch (error) {
    console.error('Delete billing address error:', error);
    return sendError(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getBillingAddresses,
  getBillingAddressById,
  createBillingAddress,
  updateBillingAddress,
  deleteBillingAddress,
};

