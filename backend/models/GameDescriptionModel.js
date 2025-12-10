const { query, queryOne } = require('../db/helpers/queryUtils');

module.exports = {
  // Get description
  getDescriptionByAppId: async (appId) => {
    return await queryOne(
      `SELECT * FROM game_descriptions WHERE app_id = $1`,
      [appId]
    );
  },

  // Create new description
  createDescription: async (appId, data) => {
    const {
      detailed_description,
      supported_languages,
      website,
      header_image,
      background,
      categories,
      genres,
    } = data;

    return await queryOne(
      `
      INSERT INTO game_descriptions (
        app_id, detailed_description, supported_languages,
        website, header_image, background, categories, genres
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        appId,
        detailed_description,
        supported_languages,
        website,
        header_image,
        background,
        categories,
        genres,
      ]
    );
  },

  // Update description
  updateDescription: async (appId, data) => {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) return null;

    values.push(appId);

    return await queryOne(
      `
      UPDATE game_descriptions
      SET ${fields.join(', ')}
      WHERE app_id = $${idx}
      RETURNING *
      `,
      values
    );
  },

  // Delete description
  deleteDescription: async (appId) => {
    await query(`DELETE FROM game_descriptions WHERE app_id = $1`, [appId]);
    return true;
  },
};
