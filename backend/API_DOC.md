API Documentation
=================

Base URL: `/api`

Auth
- `POST /auth/register` — body: `{ email, username, password, dateOfBirth?, country? }`; success: `{ success:true, data:{ userId, email }, message }`.
- `POST /auth/login` — body: `{ identifier, password }`; success: `{ success:true, data:{ user, sessionId }, message }`.
- `GET /auth/me` — session required; success: `{ success:true, data:{ user, sessionInfo }, message }`.
- `POST /auth/logout` — session required (or `X-Session-ID` header); success: `{ success:true, message }`.
- `POST /auth/verify` — body: `{ email, otpCode }`; success: `{ success:true, data:{ userId, email, verified:true }, message }`.
- `POST /auth/resend-otp` — body: `{ email }`; success: `{ success:true, data:{ email }, message }`.

Admin
- `POST /admin/login` — body: `{ email, password }`; only admins. Note: controller references an undefined `token` (endpoint likely incomplete).

User (session required)
- `GET /user/profile` — returns `{ success:true, data:{ profile }, message }`.
- `PUT /user/profile` — body: `{ preferLangIds?, preferGenreIds?, preferCateIds?, preferPlatforms? }` (`preferPlatforms` allowed: `windows|mac|linux`); success: `{ success:true, data:{ profile }, message }`.
- Billing addresses:
  - `GET /user/billing-addresses` — `{ success:true, data:{ addresses }, message }`
  - `GET /user/billing-addresses/:id` — `{ success:true, data:{ address }, message }`
  - `POST /user/billing-addresses` — body: `{ fullName, line1, city, country, line2?, state?, postalCode? }`; success: `{ success:true, data:{ address }, message }`
  - `PUT /user/billing-addresses/:id` — same fields as POST; success: `{ success:true, data:{ address }, message }`
  - `DELETE /user/billing-addresses/:id` — success: `{ success:true, message }`

Reference (public)
- `GET /reference/languages` — `{ success:true, data:{ languages } }`
- `GET /reference/languages/:id` — `{ success:true, data:{ language } }`
- `GET /reference/categories` — `{ success:true, data:{ categories } }`
- `GET /reference/categories/:id` — `{ success:true, data:{ category } }`
- `GET /reference/genres` — `{ success:true, data:{ genres } }`
- `GET /reference/genres/:id` — `{ success:true, data:{ genre } }`

Games (public; recommended uses session if present)
- All game responses now include `publishers` (array of publisher names) along with existing fields.
- `GET /games` — query: `limit`, `offset`, `sortBy`, `order`, `platform`, `minPrice`, `maxPrice`, `hasDiscount=true|false`; success: `{ success:true, data:{ games, count, limit, offset }, message }`.
- `GET /games/:appId` — success: `{ success:true, data:{ game:{ ...details, genres, categories, publishers } }, message }`.
- `GET /games/search` — query: `q` (required), `limit`, `offset`, `sortBy`, `order`; success: `{ success:true, data:{ games, count, query, limit, offset }, message }`.
- `GET /games/featured` — query: `limit`; success: `{ success:true, data:{ games }, message }`.
- `GET /games/recommended` — query: `limit`, `offset`, `minMatches`, `sortBy`, `order`; success: `{ success:true, data:{ games, count, limit, offset }, message }`.
- `GET /games/discounted` — query: `limit`, `offset`; success: `{ success:true, data:{ games, count, limit, offset }, message }`.
- `GET /games/newest` — query: `limit`, `offset`, `platform`, `genreId`, `categoryId`; success: `{ success:true, data:{ games, count, limit, offset }, message }`.
- `GET /games/genre/:genreId` — query: `limit`, `offset`, `sortBy`, `order`; success: `{ success:true, data:{ games, count, genreId, limit, offset }, message }`.
- `GET /games/category/:categoryId` — query: `limit`, `offset`, `sortBy`, `order`; success: `{ success:true, data:{ games, count, categoryId, limit, offset }, message }`.

Cart (session required)
- `GET /cart` — `{ success:true, data:{ cart }, message }` (cart includes `items` array).
- `GET /cart/count` — `{ success:true, data:{ count }, message }`.
- `POST /cart/items` — body: `{ appId }`; success: `{ success:true, data:{ cart, item }, message }`.
- `DELETE /cart/items/:appId` — success: `{ success:true, data:{ cart, appId }, message }`.
- `DELETE /cart` — success: `{ success:true, data:{ cart }, message }`.

Wishlist (session required)
- `GET /wishlist` — query: `limit`, `offset`, `sortBy`, `order` (default `added_at`, `DESC`); success: `{ success:true, data:{ games, count, limit, offset }, message }`.
- `POST /wishlist` — body: `{ appId }`; success: `{ success:true, data:{ wishlistItem, game }, message }`.
- `DELETE /wishlist/:appId` — success: `{ success:true, data:{ appId }, message }`.
- `GET /wishlist/check/:appId` — success: `{ success:true, data:{ appId, isInWishlist }, message }`.

Health
- `GET /health` — `{ status:'ok', message:'Server is running' }`

Notes
- Auth is session-cookie based (`gameShop.sid`); `X-Session-ID` header also works for cross-origin session lookup.
- Errors follow `{ success:false, error:{ message, code? } }` with appropriate HTTP status codes.
