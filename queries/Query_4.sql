UPDATE user_game_library gl
SET
    header_image = gd.header_image,
    background   = gd.background,
    categories   = gd.categories,
    genres       = gd.genres
FROM game_descriptions gd
WHERE gl.app_id = gd.app_id;
