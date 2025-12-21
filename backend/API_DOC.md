API Documentation
=================

Base URL: `/api`

All endpoints return responses in the format:
- Success: `{ success: true, data: {...}, message: "..." }`
- Error: `{ success: false, error: { message: "...", code?: "..." } }`

Authentication: Session-cookie based (`gameShop.sid`). `X-Session-ID` header also works for cross-origin session lookup.

---

## Authentication (`/api/auth`)

Public endpoints for user authentication and account management.

- **POST /auth/register**
  - Description: Register a new user account. Sends OTP verification email.
  - Body: `{ email, username, password, dateOfBirth?, country? }`
  - Response: `{ success: true, data: { userId, email }, message }`
  - Status: 201 Created

- **POST /auth/login**
  - Description: Authenticate user and create session. Accepts email or username as identifier.
  - Body: `{ identifier, password }`
  - Response: `{ success: true, data: { user, sessionId }, message }`
  - Status: 200 OK

- **GET /auth/me**
  - Description: Get current authenticated user information and session details.
  - Auth: Session required
  - Response: `{ success: true, data: { user, sessionInfo }, message }`
  - Status: 200 OK

- **POST /auth/logout**
  - Description: Destroy current user session and log out.
  - Auth: Session required (or `X-Session-ID` header)
  - Response: `{ success: true, message }`
  - Status: 200 OK

- **POST /auth/verify**
  - Description: Verify user email address using OTP code sent during registration.
  - Body: `{ email, otpCode }`
  - Response: `{ success: true, data: { userId, email, verified: true }, message }`
  - Status: 200 OK

- **POST /auth/resend-otp**
  - Description: Resend OTP verification code to user's email address.
  - Body: `{ email }`
  - Response: `{ success: true, data: { email }, message }`
  - Status: 200 OK

---

## Admin (`/api/admin`)

Admin-only endpoints for managing the platform. All endpoints require admin authentication.

- **POST /admin/login**
  - Description: Authenticate admin user and create admin session.
  - Body: `{ email, password }`
  - Response: `{ success: true, data: { user, sessionId }, message }`
  - Status: 200 OK

- **GET /admin/stats**
  - Description: Get dashboard statistics including total users, orders, games, revenue, etc.
  - Auth: Admin required
  - Response: `{ success: true, data: { stats }, message }`
  - Status: 200 OK

- **GET /admin/recent-orders**
  - Description: Get list of recent orders for admin dashboard.
  - Auth: Admin required
  - Query: `limit?` (default: 10)
  - Response: `{ success: true, data: { orders }, message }`
  - Status: 200 OK

- **GET /admin/orders**
  - Description: Get all orders in the system with pagination and filtering.
  - Auth: Admin required
  - Query: `limit?`, `offset?`, `status?`, `sortBy?`, `order?`
  - Response: `{ success: true, data: { orders, count, limit, offset }, message }`
  - Status: 200 OK

- **GET /admin/users**
  - Description: Get all registered users with pagination and filtering.
  - Auth: Admin required
  - Query: `limit?`, `offset?`, `sortBy?`, `order?`, `search?`
  - Response: `{ success: true, data: { users, count, limit, offset }, message }`
  - Status: 200 OK

- **GET /admin/games**
  - Description: Get all games in the system for admin management.
  - Auth: Admin required
  - Query: `limit?`, `offset?`, `sortBy?`, `order?`, `search?`
  - Response: `{ success: true, data: { games, count, limit, offset }, message }`
  - Status: 200 OK

- **POST /admin/games**
  - Description: Create a new game entry in the system.
  - Auth: Admin required
  - Body: Game object with required fields (appId, name, price, etc.)
  - Response: `{ success: true, data: { game }, message }`
  - Status: 201 Created

- **GET /admin/games/:id**
  - Description: Get detailed information about a specific game for admin management.
  - Auth: Admin required
  - Params: `id` (game app_id)
  - Response: `{ success: true, data: { game }, message }`
  - Status: 200 OK

- **PUT /admin/games/:id**
  - Description: Update game information (price, discount, description, etc.).
  - Auth: Admin required
  - Params: `id` (game app_id)
  - Body: Partial game object with fields to update
  - Response: `{ success: true, data: { game }, message }`
  - Status: 200 OK

- **GET /admin/reviews/recent**
  - Description: Get recent game reviews for admin moderation.
  - Auth: Admin required
  - Query: `limit?` (default: 10)
  - Response: `{ success: true, data: { reviews }, message }`
  - Status: 200 OK

- **GET /admin/reviews**
  - Description: Get all reviews with pagination and filtering.
  - Auth: Admin required
  - Query: `limit?`, `offset?`, `sortBy?`, `order?`, `appId?`, `userId?`
  - Response: `{ success: true, data: { reviews, count, limit, offset }, message }`
  - Status: 200 OK

- **PUT /admin/reviews/:id/reply**
  - Description: Add admin reply to a user review for moderation/response.
  - Auth: Admin required
  - Params: `id` (review ID)
  - Body: `{ replyText }`
  - Response: `{ success: true, data: { review }, message }`
  - Status: 200 OK

- **GET /admin/payments**
  - Description: Get all payment transactions in the system.
  - Auth: Admin required
  - Query: `limit?`, `offset?`, `status?`, `sortBy?`, `order?`
  - Response: `{ success: true, data: { payments, count, limit, offset }, message }`
  - Status: 200 OK

- **GET /admin/payments/pending**
  - Description: Get all pending payment transactions requiring admin attention.
  - Auth: Admin required
  - Query: `limit?`, `offset?`
  - Response: `{ success: true, data: { payments, count, limit, offset }, message }`
  - Status: 200 OK

- **PUT /admin/payments/:id/status**
  - Description: Update payment status (e.g., approve, reject, mark as completed).
  - Auth: Admin required
  - Params: `id` (payment ID)
  - Body: `{ status }` (e.g., "approved", "rejected", "completed")
  - Response: `{ success: true, data: { payment }, message }`
  - Status: 200 OK

---

## User Profile (`/api/user`)

User account management endpoints. All endpoints require user authentication.

- **GET /user/profile**
  - Description: Get current user's profile information including preferences, languages, genres, categories, and platforms.
  - Auth: Session required
  - Response: `{ success: true, data: { profile }, message }`
  - Status: 200 OK

- **PUT /user/profile**
  - Description: Update user profile information including username, email, date of birth, country, and preferences.
  - Auth: Session required
  - Body: `{ username?, email?, dateOfBirth?, country?, preferLangIds?, preferGenreIds?, preferCateIds?, preferPlatforms? }`
  - Note: `preferPlatforms` allowed values: `windows`, `mac`, `linux`
  - Response: `{ success: true, data: { profile }, message }`
  - Status: 200 OK

- **GET /user/billing-addresses**
  - Description: Get all billing addresses saved by the current user.
  - Auth: Session required
  - Response: `{ success: true, data: { addresses }, message }`
  - Status: 200 OK

- **GET /user/billing-addresses/:id**
  - Description: Get a specific billing address by ID.
  - Auth: Session required
  - Params: `id` (address ID)
  - Response: `{ success: true, data: { address }, message }`
  - Status: 200 OK

- **POST /user/billing-addresses**
  - Description: Create a new billing address for the current user.
  - Auth: Session required
  - Body: `{ fullName, line1, city, country, line2?, state?, postalCode? }`
  - Response: `{ success: true, data: { address }, message }`
  - Status: 201 Created

- **PUT /user/billing-addresses/:id**
  - Description: Update an existing billing address.
  - Auth: Session required
  - Params: `id` (address ID)
  - Body: `{ fullName?, line1?, line2?, city?, state?, postalCode?, country? }`
  - Response: `{ success: true, data: { address }, message }`
  - Status: 200 OK

- **DELETE /user/billing-addresses/:id**
  - Description: Delete a billing address.
  - Auth: Session required
  - Params: `id` (address ID)
  - Response: `{ success: true, message }`
  - Status: 200 OK

- **GET /user/library**
  - Description: Get user's game library (owned games) with pagination and sorting.
  - Auth: Session required
  - Query: `limit?` (default: 50), `offset?` (default: 0), `sortBy?` (default: 'added_at'), `order?` (default: 'DESC')
  - Response: `{ success: true, data: { games, count, limit, offset }, message }`
  - Status: 200 OK

---

## Reference Data (`/api/reference`)

Public endpoints for retrieving reference data (languages, genres, categories).

- **GET /reference/languages**
  - Description: Get all available languages in the system.
  - Response: `{ success: true, data: { languages }, message }`
  - Status: 200 OK

- **GET /reference/languages/:id**
  - Description: Get a specific language by ID.
  - Params: `id` (language ID)
  - Response: `{ success: true, data: { language }, message }`
  - Status: 200 OK

- **GET /reference/categories**
  - Description: Get all game categories in the system.
  - Response: `{ success: true, data: { categories }, message }`
  - Status: 200 OK

- **GET /reference/categories/:id**
  - Description: Get a specific category by ID.
  - Params: `id` (category ID)
  - Response: `{ success: true, data: { category }, message }`
  - Status: 200 OK

- **GET /reference/genres**
  - Description: Get all game genres in the system.
  - Response: `{ success: true, data: { genres }, message }`
  - Status: 200 OK

- **GET /reference/genres/:id**
  - Description: Get a specific genre by ID.
  - Params: `id` (genre ID)
  - Response: `{ success: true, data: { genre }, message }`
  - Status: 200 OK

---

## Games (`/api/games`)

Public endpoints for browsing and searching games. Some endpoints use optional authentication for personalization.

- **GET /games**
  - Description: Get paginated list of games with filtering and sorting options.
  - Query: `limit?`, `offset?`, `sortBy?`, `order?`, `platform?`, `minPrice?`, `maxPrice?`, `hasDiscount?` (true/false)
  - Response: `{ success: true, data: { games, count, limit, offset }, message }`
  - Note: All game responses include `publishers` array, `header_image`, and `background` fields.
  - Status: 200 OK

- **GET /games/:appId**
  - Description: Get detailed information about a specific game including full description, supported languages, website, images, developers, languages, categories, genres, and system requirements.
  - Params: `appId` (Steam app ID)
  - Response: `{ success: true, data: { game: { ...gameFields, detailed_description, supported_languages, website, header_image, background, publishers, developers: [{id, name}], languages: [{id, name}], categories: [{id, name}], genres: [{id, name}], specs... } }, message }`
  - Status: 200 OK

- **GET /games/search**
  - Description: Full-text search for games by name or description.
  - Query: `q` (required, search query), `limit?`, `offset?`, `sortBy?`, `order?`
  - Response: `{ success: true, data: { games, count, query, limit, offset }, message }`
  - Status: 200 OK

- **GET /games/search/autocomplete**
  - Description: Get autocomplete suggestions for game search (typically returns game names matching the query).
  - Query: `q` (required, search query), `limit?` (default: 10)
  - Response: `{ success: true, data: { games }, message }`
  - Status: 200 OK

- **GET /games/featured**
  - Description: Get featured/promoted games.
  - Query: `limit?` (default: 10)
  - Response: `{ success: true, data: { games }, message }`
  - Status: 200 OK

- **GET /games/recommended**
  - Description: Get personalized game recommendations based on user preferences (uses session if available).
  - Query: `limit?`, `offset?`, `minMatches?`, `sortBy?`, `order?`
  - Auth: Optional (better results with session)
  - Response: `{ success: true, data: { games, count, limit, offset }, message }`
  - Status: 200 OK

- **GET /games/discounted**
  - Description: Get games currently on sale/discount.
  - Query: `limit?`, `offset?`
  - Response: `{ success: true, data: { games, count, limit, offset }, message }`
  - Status: 200 OK

- **GET /games/newest**
  - Description: Get newest games added to the platform.
  - Query: `limit?`, `offset?`, `platform?`, `genreId?`, `categoryId?`
  - Response: `{ success: true, data: { games, count, limit, offset }, message }`
  - Status: 200 OK

- **GET /games/genre/:genreId**
  - Description: Get games filtered by a specific genre.
  - Params: `genreId` (genre ID)
  - Query: `limit?`, `offset?`, `sortBy?`, `order?`
  - Response: `{ success: true, data: { games, count, genreId, limit, offset }, message }`
  - Status: 200 OK

- **GET /games/category/:categoryId**
  - Description: Get games filtered by a specific category.
  - Params: `categoryId` (category ID)
  - Query: `limit?`, `offset?`, `sortBy?`, `order?`
  - Response: `{ success: true, data: { games, count, categoryId, limit, offset }, message }`
  - Status: 200 OK

- **GET /games/:appId/reviews**
  - Description: Get all reviews for a specific game.
  - Params: `appId` (game app ID)
  - Query: `limit?`, `offset?`, `sortBy?`, `order?`
  - Response: `{ success: true, data: { reviews, count, limit, offset }, message }`
  - Status: 200 OK

- **GET /games/:appId/review/me**
  - Description: Get current user's review for a specific game (if exists).
  - Auth: Session required
  - Params: `appId` (game app ID)
  - Response: `{ success: true, data: { review }, message }` or `{ success: true, data: { review: null }, message }`
  - Status: 200 OK

---

## Cart (`/api/cart`)

Shopping cart management endpoints. All endpoints require user authentication.

- **GET /cart**
  - Description: Get current user's shopping cart with all items and total price.
  - Auth: Session required
  - Response: `{ success: true, data: { cart: { id, user_id, total_price, items: [...] } }, message }`
  - Status: 200 OK

- **GET /cart/count**
  - Description: Get the number of items in the current user's cart.
  - Auth: Session required
  - Response: `{ success: true, data: { count }, message }`
  - Status: 200 OK

- **POST /cart/items**
  - Description: Add a game to the shopping cart.
  - Auth: Session required
  - Body: `{ appId }`
  - Response: `{ success: true, data: { cart, item }, message }`
  - Status: 200 OK

- **DELETE /cart/items/:appId**
  - Description: Remove a game from the shopping cart.
  - Auth: Session required
  - Params: `appId` (game app ID)
  - Response: `{ success: true, data: { cart, appId }, message }`
  - Status: 200 OK

- **DELETE /cart**
  - Description: Clear all items from the shopping cart.
  - Auth: Session required
  - Response: `{ success: true, data: { cart }, message }`
  - Status: 200 OK

- **POST /cart/validate-coupon**
  - Description: Validate a coupon code and return discount information.
  - Auth: Session required
  - Body: `{ couponCode }`
  - Response: `{ success: true, data: { coupon, discount }, message }`
  - Status: 200 OK

- **POST /cart/checkout**
  - Description: Process cart checkout, create order, and handle payment.
  - Auth: Session required
  - Body: `{ billingAddressId?, paymentMethod?, couponCode? }`
  - Response: `{ success: true, data: { order, payment }, message }`
  - Status: 200 OK

---

## Wishlist (`/api/wishlist`)

User wishlist management endpoints. All endpoints require user authentication.

- **GET /wishlist**
  - Description: Get current user's wishlist with pagination and sorting.
  - Auth: Session required
  - Query: `limit?`, `offset?`, `sortBy?` (default: 'added_at'), `order?` (default: 'DESC')
  - Response: `{ success: true, data: { games, count, limit, offset }, message }`
  - Status: 200 OK

- **POST /wishlist**
  - Description: Add a game to the user's wishlist.
  - Auth: Session required
  - Body: `{ appId }`
  - Response: `{ success: true, data: { wishlistItem, game }, message }`
  - Status: 200 OK

- **DELETE /wishlist/:appId**
  - Description: Remove a game from the user's wishlist.
  - Auth: Session required
  - Params: `appId` (game app ID)
  - Response: `{ success: true, data: { appId }, message }`
  - Status: 200 OK

- **GET /wishlist/check/:appId**
  - Description: Check if a game is in the user's wishlist.
  - Auth: Session required
  - Params: `appId` (game app ID)
  - Response: `{ success: true, data: { appId, isInWishlist: true/false }, message }`
  - Status: 200 OK

---

## Library (`/api/library`)

User game library (owned games) and review management. All endpoints require user authentication.

- **GET /library**
  - Description: Get user's game library (all owned games) with pagination and sorting.
  - Auth: Session required
  - Query: `limit?` (default: 50), `offset?` (default: 0), `sortBy?` (default: 'added_at'), `order?` (default: 'DESC')
  - Response: `{ success: true, data: { games, count, limit, offset }, message }`
  - Status: 200 OK

- **POST /library/review**
  - Description: Create or update a review for a game in the user's library. Users can only review games they own.
  - Auth: Session required
  - Body: `{ appId, isRecommended (boolean), reviewText? }`
  - Response: `{ success: true, data: { review }, message }`
  - Status: 201 Created (new) or 200 OK (updated)

---

## Orders (`/api/orders`)

Order management endpoints for users. All endpoints require user authentication.

- **GET /orders**
  - Description: Get current user's order history with pagination.
  - Auth: Session required
  - Query: `limit?`, `offset?`, `sortBy?`, `order?`, `status?`
  - Response: `{ success: true, data: { orders, count, limit, offset }, message }`
  - Status: 200 OK

- **GET /orders/:id**
  - Description: Get detailed information about a specific order including items, payment, and status.
  - Auth: Session required
  - Params: `id` (order ID)
  - Response: `{ success: true, data: { order }, message }`
  - Status: 200 OK

---

## Payments (`/api/payments`)

Payment processing endpoints. All endpoints require user authentication.

- **POST /payments**
  - Description: Create a new payment transaction for an order.
  - Auth: Session required
  - Body: `{ orderId, paymentMethod, amount, billingAddressId? }`
  - Response: `{ success: true, data: { payment }, message }`
  - Status: 201 Created

---

## Health Check (`/api/health`)

System health and status endpoint.

- **GET /health**
  - Description: Check if the server is running and responsive.
  - Response: `{ status: 'ok', message: 'Server is running' }`
  - Status: 200 OK

---

## Notes

- **Authentication**: Session-based authentication using cookies (`gameShop.sid`). The `X-Session-ID` header can also be used for cross-origin session lookup.

- **Error Format**: All errors follow the format:
  ```json
  {
    "success": false,
    "error": {
      "message": "Error description",
      "code": "ERROR_CODE" // optional
    }
  }
  ```
  Appropriate HTTP status codes are returned (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error, etc.).

- **Pagination**: Most list endpoints support pagination via `limit` and `offset` query parameters. Default values vary by endpoint.

- **Sorting**: Many endpoints support sorting via `sortBy` and `order` query parameters. Common `sortBy` values include: `created_at`, `price`, `name`, `added_at`, etc. `order` can be `ASC` or `DESC`.

- **Game Data**: All game list/search responses include `publishers` (array of publisher names), `header_image`, and `background` fields for consistent frontend display.
