const db = require('../db');
const { query, queryOne } = require('../db/helpers/queries');

module.exports = {
    getGameById: async (appId) => {
        return await queryOne('SELECT * FROM games WHERE app_id = $1', [appId]);
    },

    // create a new game
    createGame : async (game) => {
        const{
            app_id,
            name,
            type,
            required_age,
            release_date,
            price_final,
            price_org,
            discount_percent,
            price_currency,
            platforms_windows,
            platforms_mac,
            platforms_linux,
        }= game;

        return await queryOne(
            `INSERT INTO games(
            app_id, name, type, required_age, release_date,
            recommendations_total, price_final, price_org, discount_percent, 
            price_currency, platforms_windows, platforms_mac, platforms_linux
            )
            VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [
                app_id,
                name,
                type,
                required_age,
                release_date,
                price_final,
                price_org,
                discount_percent,
                price_currency,
                platforms_windows,
                platforms_mac,
                platforms_linux,
            ]
        );
    },

    // update game
    updateGame: async (appId, game) => {
        const fileds = [];
        const values = [];
        let index = 1;

        const allowed = [
            "name", "type", "required_age", "release_date",
            "price_final", "price_org", "discount_percent",
            "price_currency", "platforms_windows", "platforms_mac", "platforms_linux"
        ];
        for (const [key, value] of Object.entries(game)) {
            if (allowed.includes(key)) {
                fileds.push(`${key} = $${index}`);
                values.push(value);
                index++;
            }
        }

        if (fileds.length === 0) { return null; }

        values.push(appId);

        return await queryOne(
            `Update games SET ${fileds.join(', ')} WHERE app_id = $${index} RETURNING *`,
            values
        );
    },

    // delete game
    deleteGame: async (appId) => {
        await query('DELETE FROM games WHERE app_id = $1', [appId]);
        return true;
    }
};
