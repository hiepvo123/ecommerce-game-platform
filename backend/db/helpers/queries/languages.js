// backend/db/helpers/queries/languages.js
const { query, queryOne } = require('../queryUtils');

/**
 * Language queries
 */

const languagesQueries = {
  /**
   * Get all languages
   * @returns {Promise<Array>} Array of languages
   */
  getAllLanguages: async () => {
    const queryText = 'SELECT * FROM languages ORDER BY name';
    return await query(queryText);
  },

  /**
   * Get language by ID
   * @param {number} languageId - Language ID
   * @returns {Promise<Object|null>} Language object or null
   */
  getLanguageById: async (languageId) => {
    const queryText = 'SELECT * FROM languages WHERE id = $1';
    return await queryOne(queryText, [languageId]);
  },

  /**
   * Get language by name
   * @param {string} name - Language name
   * @returns {Promise<Object|null>} Language object or null
   */
  getLanguageByName: async (name) => {
    const queryText = 'SELECT * FROM languages WHERE name = $1';
    return await queryOne(queryText, [name]);
  },
};

module.exports = languagesQueries;

