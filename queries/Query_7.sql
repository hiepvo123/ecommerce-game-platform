SELECT *
FROM game_descriptions
ORDER BY app_id DESC
LIMIT 2;
INSERT INTO user_game_library (
    user_id,
    app_id,
    order_id,
    added_at,
    header_image,
    background,
    categories,
    genres
)
SELECT
    1              AS user_id,
    gd.app_id,
    NULL           AS order_id,
    NOW()          AS added_at,
    gd.background
FROM game_descriptions gd
ORDER BY gd.app_id DESC
LIMIT 2;