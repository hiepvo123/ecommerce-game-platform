// backend/db/helpers/queries/games.js
const { query, queryOne, buildWhereClause, buildOrderClause, buildPaginationClause } = require('../queryUtils');

/**
 * Game queries
 */

const gamesQueries = {

  /**
   * Get total count of games
   * @returns {Promise<number>} Total game count
   */
  getCountOfGames: async () => {
    const queryText = 'SELECT COUNT(*) AS count FROM games';
    const result = await queryOne(queryText);
    // Trả về số lượng dưới dạng số nguyên
    return parseInt(result?.count, 10)||0;
  },


  /**
   * Get all games
   * @param {Object} options - Query options (limit, offset, sortBy, order)
   * @returns {Promise<Array>} Array of games
   */
  getAllGames: async (options = {}) => {
    const { limit, offset, sortBy = 'name', order = 'ASC' } = options;
    const orderClause = buildOrderClause(`g.${sortBy}`, order);
    const paginationClause = buildPaginationClause(limit, offset);
    
    const queryText = `
      SELECT g.*, gd.header_image, gd.background, pub.publishers
      FROM games g
      LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
      LEFT JOIN LATERAL (
        SELECT array_agg(DISTINCT p.name) AS publishers
        FROM game_publishers gp
        JOIN publishers p ON gp.publisher_id = p.id
        WHERE gp.app_id = g.app_id
      ) pub ON TRUE
      ${orderClause}
      ${paginationClause}
    `.trim();
    
    return await query(queryText);
  },

  /**
   * Get game by app_id
   * @param {number} appId - Game app_id
   * @returns {Promise<Object|null>} Game object or null
   */
  getGameById: async (appId) => {
    const queryText = 'SELECT * FROM games WHERE app_id = $1';
    return await queryOne(queryText, [appId]);
  },

  /**
   * Get game with full details (game, description, specs)
   * @param {number} appId - Game app_id
   * @returns {Promise<Object|null>} Game with full details or null
   */
  getGameWithDetails: async (appId) => {
    const queryText = `
      SELECT 
        g.*,
        gd.detailed_description,
        gd.supported_languages,
        gd.website,
        gd.header_image,
        gd.background,
        gd.categories,
        gd.genres,
        pub.publishers,
        gs.pc_min_os,
        gs.pc_min_processor,
        gs.pc_min_memory,
        gs.pc_min_graphics,
        gs.pc_min_directx,
        gs.pc_min_network,
        gs.pc_min_storage,
        gs.pc_rec_os,
        gs.pc_rec_processor,
        gs.pc_rec_memory,
        gs.pc_rec_graphics,
        gs.pc_rec_directx,
        gs.pc_rec_network,
        gs.pc_rec_storage
      FROM games g
      LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
      LEFT JOIN LATERAL (
        SELECT array_agg(DISTINCT p.name) AS publishers
        FROM game_publishers gp
        JOIN publishers p ON gp.publisher_id = p.id
        WHERE gp.app_id = g.app_id
      ) pub ON TRUE
      LEFT JOIN game_specs gs ON g.app_id = gs.app_id
      WHERE g.app_id = $1
    `;
    return await queryOne(queryText, [appId]);
  },

  /**
   * Get games by filters (platform, price range, etc.)
   * @param {Object} filters - Filter object
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of games
   */
  getGamesByFilter: async (filters = {}, options = {}) => {
    const { limit, offset, sortBy = 'name', order = 'ASC' } = options;
    const paramValues = [];
    const conditions = [];
    let paramIndex = 1;

    // Platform filters
    if (filters.platform === 'windows') {
      conditions.push(`platforms_windows = true`);
    } else if (filters.platform === 'mac') {
      conditions.push(`platforms_mac = true`);
    } else if (filters.platform === 'linux') {
      conditions.push(`platforms_linux = true`);
    }

    // Price range
    if (filters.minPrice !== undefined) {
      conditions.push(`price_final >= $${paramIndex}`);
      paramValues.push(filters.minPrice);
      paramIndex++;
    }
    if (filters.maxPrice !== undefined) {
      conditions.push(`price_final <= $${paramIndex}`);
      paramValues.push(filters.maxPrice);
      paramIndex++;
    }

    // Discount filter
    if (filters.hasDiscount !== undefined && filters.hasDiscount) {
      conditions.push(`discount_percent > 0`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = buildOrderClause(`g.${sortBy}`, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT g.*, gd.header_image, gd.background, pub.publishers
      FROM games g
      LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
      LEFT JOIN LATERAL (
        SELECT array_agg(DISTINCT p.name) AS publishers
        FROM game_publishers gp
        JOIN publishers p ON gp.publisher_id = p.id
        WHERE gp.app_id = g.app_id
      ) pub ON TRUE
      ${whereClause}
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, paramValues);
  },

  /**
   * Search games using PostgreSQL Full-Text Search
   * Searches in game name and detailed description
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of games
   */
  searchGames: async (searchTerm, options = {}) => {
    const { limit, offset, sortBy, order } = options;
    const paginationClause = buildPaginationClause(limit, offset);

    // Convert search term to tsquery for full-text search
    // plainto_tsquery handles multiple words and removes punctuation
    const searchQuery = `plainto_tsquery('english', $1)`;
    
    // Build search vector from name (weight A - highest) and description (weight B)
    // Coalesce to handle NULL descriptions
    const searchVector = `
      setweight(to_tsvector('english', COALESCE(g.name, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(gd.detailed_description, '')), 'B')
    `;

    // Calculate relevance rank
    const relevanceRank = `ts_rank(${searchVector}, ${searchQuery})`;

    // Determine ordering: if sortBy is specified and not 'relevance', use it; otherwise use relevance
    let orderClause;
    if (sortBy && sortBy !== 'relevance') {
      // User wants to sort by a specific field (e.g., price, recommendations_total)
      orderClause = buildOrderClause(`g.${sortBy}`, order || 'ASC');
    } else {
      // Default: sort by relevance (highest first), then by name for tie-breaking
      orderClause = `ORDER BY ${relevanceRank} DESC, g.name ASC`;
    }

    const queryText = `
      SELECT g.*, gd.header_image, gd.background, pub.publishers, ${relevanceRank} as relevance
      FROM games g
      LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
      LEFT JOIN LATERAL (
        SELECT array_agg(DISTINCT p.name) AS publishers
        FROM game_publishers gp
        JOIN publishers p ON gp.publisher_id = p.id
        WHERE gp.app_id = g.app_id
      ) pub ON TRUE
      WHERE ${searchVector} @@ ${searchQuery}
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [searchTerm]);
  },

  /**
   * Get games by genre
   * @param {number} genreId - Genre ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of games
   */
  getGamesByGenre: async (genreId, options = {}) => {
    const { limit, offset, sortBy = 'name', order = 'ASC' } = options;
    const orderClause = buildOrderClause(`g.${sortBy}`, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT g.*, gd.header_image, gd.background, pub.publishers
      FROM games g
      INNER JOIN game_genres gg ON g.app_id = gg.app_id
      LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
      LEFT JOIN LATERAL (
        SELECT array_agg(DISTINCT p.name) AS publishers
        FROM game_publishers gp
        JOIN publishers p ON gp.publisher_id = p.id
        WHERE gp.app_id = g.app_id
      ) pub ON TRUE
      WHERE gg.genre_id = $1
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [genreId]);
  },

  /**
   * Get games by category
   * @param {number} categoryId - Category ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of games
   */
  getGamesByCategory: async (categoryId, options = {}) => {
    const { limit, offset, sortBy = 'name', order = 'ASC' } = options;
    const orderClause = buildOrderClause(`g.${sortBy}`, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT g.*, gd.header_image, gd.background, pub.publishers
      FROM games g
      INNER JOIN game_categories gc ON g.app_id = gc.app_id
      LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
      LEFT JOIN LATERAL (
        SELECT array_agg(DISTINCT p.name) AS publishers
        FROM game_publishers gp
        JOIN publishers p ON gp.publisher_id = p.id
        WHERE gp.app_id = g.app_id
      ) pub ON TRUE
      WHERE gc.category_id = $1
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [categoryId]);
  },

  /**
   * Get games by developer
   * @param {number} developerId - Developer ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of games
   */
  getGamesByDeveloper: async (developerId, options = {}) => {
    const { limit, offset, sortBy = 'name', order = 'ASC' } = options;
    const orderClause = buildOrderClause(`g.${sortBy}`, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT g.*, descs.header_image, descs.background, pub.publishers
      FROM games g
      INNER JOIN game_developers gd ON g.app_id = gd.app_id
      LEFT JOIN game_descriptions descs ON g.app_id = descs.app_id
      LEFT JOIN LATERAL (
        SELECT array_agg(DISTINCT p.name) AS publishers
        FROM game_publishers gp
        JOIN publishers p ON gp.publisher_id = p.id
        WHERE gp.app_id = g.app_id
      ) pub ON TRUE
      WHERE gd.developer_id = $1
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [developerId]);
  },

  /**
   * Get games by publisher
   * @param {number} publisherId - Publisher ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of games
   */
  getGamesByPublisher: async (publisherId, options = {}) => {
    const { limit, offset, sortBy = 'name', order = 'ASC' } = options;
    const orderClause = buildOrderClause(`g.${sortBy}`, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT g.*, descs.header_image, descs.background, pub.publishers
      FROM games g
      INNER JOIN game_publishers gp ON g.app_id = gp.app_id
      LEFT JOIN game_descriptions descs ON g.app_id = descs.app_id
      LEFT JOIN LATERAL (
        SELECT array_agg(DISTINCT p.name) AS publishers
        FROM game_publishers gp2
        JOIN publishers p ON gp2.publisher_id = p.id
        WHERE gp2.app_id = g.app_id
      ) pub ON TRUE
      WHERE gp.publisher_id = $1
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText, [publisherId]);
  },

  /**
   * Get discounted games
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of discounted games
   */
  getDiscountedGames: async (options = {}) => {
    const { limit, offset, sortBy = 'discount_percent', order = 'DESC' } = options;
    const orderClause = buildOrderClause(`g.${sortBy}`, order);
    const paginationClause = buildPaginationClause(limit, offset);

    const queryText = `
      SELECT g.*, gd.header_image, gd.background, pub.publishers
      FROM games g
      LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
      LEFT JOIN LATERAL (
        SELECT array_agg(DISTINCT p.name) AS publishers
        FROM game_publishers gp
        JOIN publishers p ON gp.publisher_id = p.id
        WHERE gp.app_id = g.app_id
      ) pub ON TRUE
      WHERE g.discount_percent > 0
      ${orderClause}
      ${paginationClause}
    `.trim();

    return await query(queryText);
  },

  /**
   * Get recommended games based on user preferences
   * @param {number} userId - User ID
   * @param {Object} options - Query options (limit, offset, minMatches, sortBy, order)
   * @returns {Promise<Array>} Array of recommended games
   */
  getRecommendedGames: async (userId, options = {}) => {
    const { limit = 20, offset = 0, minMatches = 15, sortBy = 'recommendations_total', order = 'DESC' } = options;
    
    // First, get user preferences
    const profileQuery = 'SELECT prefer_lang_ids, prefer_genre_ids, prefer_cate_ids, prefer_platforms FROM user_profiles WHERE user_id = $1';
    const profile = await queryOne(profileQuery, [userId]);
    
    // If no profile exists, return top games
    if (!profile) {
      const orderClause = buildOrderClause(`g.${sortBy}`, order);
      const queryText = `
        SELECT g.*, gd.header_image, gd.background, pub.publishers
        FROM games g
        LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
        LEFT JOIN LATERAL (
          SELECT array_agg(DISTINCT p.name) AS publishers
          FROM game_publishers gp
          JOIN publishers p ON gp.publisher_id = p.id
          WHERE gp.app_id = g.app_id
        ) pub ON TRUE
        ${orderClause}
        LIMIT $1 OFFSET $2
      `;
      return await query(queryText, [limit, offset]);
    }
    
    // Build matching conditions
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    // Match languages
    if (profile.prefer_lang_ids && profile.prefer_lang_ids.length > 0) {
      conditions.push(`EXISTS (
        SELECT 1 FROM game_languages gl 
        WHERE gl.app_id = g.app_id 
        AND gl.language_id = ANY($${paramIndex})
      )`);
      params.push(profile.prefer_lang_ids);
      paramIndex++;
    }
    
    // Match genres
    if (profile.prefer_genre_ids && profile.prefer_genre_ids.length > 0) {
      conditions.push(`EXISTS (
        SELECT 1 FROM game_genres gg 
        WHERE gg.app_id = g.app_id 
        AND gg.genre_id = ANY($${paramIndex})
      )`);
      params.push(profile.prefer_genre_ids);
      paramIndex++;
    }
    
    // Match categories
    if (profile.prefer_cate_ids && profile.prefer_cate_ids.length > 0) {
      conditions.push(`EXISTS (
        SELECT 1 FROM game_categories gc 
        WHERE gc.app_id = g.app_id 
        AND gc.category_id = ANY($${paramIndex})
      )`);
      params.push(profile.prefer_cate_ids);
      paramIndex++;
    }
    
    // Match platforms
    if (profile.prefer_platforms && profile.prefer_platforms.length > 0) {
      const platformConditions = [];
      profile.prefer_platforms.forEach(platform => {
        if (platform === 'windows') {
          platformConditions.push('g.platforms_windows = true');
        } else if (platform === 'mac') {
          platformConditions.push('g.platforms_mac = true');
        } else if (platform === 'linux') {
          platformConditions.push('g.platforms_linux = true');
        }
      });
      if (platformConditions.length > 0) {
        conditions.push(`(${platformConditions.join(' OR ')})`);
      }
    }
    
    // If no preferences set, return top games
    if (conditions.length === 0) {
      const orderClause = buildOrderClause(`g.${sortBy}`, order);
      const queryText = `
        SELECT g.*, gd.header_image, gd.background, pub.publishers
        FROM games g
        LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
        LEFT JOIN LATERAL (
          SELECT array_agg(DISTINCT p.name) AS publishers
          FROM game_publishers gp
          JOIN publishers p ON gp.publisher_id = p.id
          WHERE gp.app_id = g.app_id
        ) pub ON TRUE
        ${orderClause}
        LIMIT $1 OFFSET $2
      `;
      return await query(queryText, [limit, offset]);
    }
    
    // Build the query with preferences
    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const orderClause = buildOrderClause(`g.${sortBy}`, order);
    
    let queryText = `
      SELECT g.*, gd.header_image, gd.background, pub.publishers,
             COUNT(*) OVER() as total_matches
      FROM games g
      LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
      LEFT JOIN LATERAL (
        SELECT array_agg(DISTINCT p.name) AS publishers
        FROM game_publishers gp
        JOIN publishers p ON gp.publisher_id = p.id
        WHERE gp.app_id = g.app_id
      ) pub ON TRUE
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);
    
    // Execute query and check if we have enough matches
    const matchedGames = await query(queryText, params);
    
    // If we have fewer matches than minMatches, supplement with top games
    if (matchedGames.length < minMatches && matchedGames.length < limit) {
      const needed = Math.min(minMatches - matchedGames.length, limit - matchedGames.length);
      
      // Get top games by recommendations that aren't already in results
      const matchedAppIds = matchedGames.map(g => g.app_id);
      let supplementQuery;
      let supplementParams;
      
      if (matchedAppIds.length > 0) {
        // Use parameterized query for safety
        const supplementOrderClause = buildOrderClause(`g.${sortBy}`, order);
        supplementQuery = `
          SELECT g.*, gd.header_image, gd.background, pub.publishers
          FROM games g
          LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
          LEFT JOIN LATERAL (
            SELECT array_agg(DISTINCT p.name) AS publishers
            FROM game_publishers gp
            JOIN publishers p ON gp.publisher_id = p.id
            WHERE gp.app_id = g.app_id
          ) pub ON TRUE
          WHERE g.app_id NOT IN (${matchedAppIds.map((_, i) => `$${i + 1}`).join(',')})
          ${supplementOrderClause}
          LIMIT $${matchedAppIds.length + 1}
        `;
        supplementParams = [...matchedAppIds, needed];
      } else {
        const supplementOrderClause = buildOrderClause(`g.${sortBy}`, order);
        supplementQuery = `
          SELECT g.*, gd.header_image, gd.background, pub.publishers
          FROM games g
          LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
          LEFT JOIN LATERAL (
            SELECT array_agg(DISTINCT p.name) AS publishers
            FROM game_publishers gp
            JOIN publishers p ON gp.publisher_id = p.id
            WHERE gp.app_id = g.app_id
          ) pub ON TRUE
          ${supplementOrderClause}
          LIMIT $1
        `;
        supplementParams = [needed];
      }
      
      const supplementGames = await query(supplementQuery, supplementParams);
      
      // Combine and re-sort the combined results to maintain sort order
      const combinedGames = [...matchedGames, ...supplementGames];
      
      // Sort the combined array based on sortBy and order
      combinedGames.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        // Handle null/undefined values
        if (aVal == null) aVal = order === 'ASC' ? Infinity : -Infinity;
        if (bVal == null) bVal = order === 'ASC' ? Infinity : -Infinity;
        
        // Convert to numbers if needed
        if (typeof aVal === 'string' && !isNaN(aVal)) aVal = parseFloat(aVal);
        if (typeof bVal === 'string' && !isNaN(bVal)) bVal = parseFloat(bVal);
        
        if (order === 'ASC') {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
      });
      
      return combinedGames.slice(0, limit);
    }
    
    return matchedGames;
  },

  /**
   * Get newest games by release date (latest first)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of newest games
   */
  getNewestGames: async (options = {}) => {
    const { limit = 20, offset = 0, platform, genreId, categoryId } = options;
    const params = [];
    const where = [];

    if (platform) {
      params.push(platform);
      where.push(`$${params.length} = ANY(g.platforms)`);
    }

    if (genreId) {
      params.push(genreId);
      where.push(`$${params.length} = ANY(g.genre_ids)`);
    }

    if (categoryId) {
      params.push(categoryId);
      where.push(`$${params.length} = ANY(g.category_ids)`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    params.push(limit, offset);

    const queryText = `
      SELECT g.*, gd.header_image, gd.background, pub.publishers
      FROM games g
      LEFT JOIN game_descriptions gd ON g.app_id = gd.app_id
      LEFT JOIN LATERAL (
        SELECT array_agg(DISTINCT p.name) AS publishers
        FROM game_publishers gp
        JOIN publishers p ON gp.publisher_id = p.id
        WHERE gp.app_id = g.app_id
      ) pub ON TRUE
      ${whereClause}
      ORDER BY g.release_date DESC NULLS LAST, g.recommendations_total DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    return await query(queryText, params);
  },
};

module.exports = gamesQueries;

