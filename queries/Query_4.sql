UPDATE user_wishlist_items w
SET
    header_image = gd.header_image,
    background = gd.background,
    categories = gd.categories,
    genres = gd.genres
FROM game_descriptions gd
WHERE w.app_id = gd.app_id;
