API Documentation
=================

Base URL: `/api`

This document groups endpoints by area and provides a compact table with three columns: Method, Endpoint, Description.

---

## Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user (sends OTP verification email). |
| POST | `/auth/login` | Authenticate user and create session (email or username). |
| GET | `/auth/me` | Get current authenticated user information. |
| POST | `/auth/logout` | Destroy current user session and log out. |
| POST | `/auth/verify` | Verify user email using OTP code. |
| POST | `/auth/resend-otp` | Resend OTP verification code to email. |

---

## Admin

| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/login` | Authenticate admin and create admin session. |
| GET | `/admin/stats` | Get dashboard statistics (users, orders, revenue, etc.). |
| GET | `/admin/recent-orders` | Get recent orders for admin dashboard. |
| GET | `/admin/orders` | List all orders with pagination and filters. |
| GET | `/admin/users` | List all users with pagination and filters. |
| GET | `/admin/games` | List all games for admin management. |
| POST | `/admin/games` | Create a new game entry. |
| GET | `/admin/games/:id` | Get detailed info for a specific game. |
| PUT | `/admin/games/:id` | Update game information. |
| GET | `/admin/reviews/recent` | Get recent reviews for moderation. |
| GET | `/admin/reviews` | List reviews with pagination and filters. |
| PUT | `/admin/reviews/:id/reply` | Add or update admin reply to a review. |
| GET | `/admin/payments` | List payment transactions. |
| GET | `/admin/payments/pending` | List pending payment transactions. |
| PUT | `/admin/payments/:id/status` | Update payment status (approve/reject/complete). |

---

## User Profile

| Method | Endpoint | Description |
|---|---|---|
| GET | `/user/profile` | Get current user's profile and preferences. |
| PUT | `/user/profile` | Update user profile and preferences. |
| GET | `/user/billing-addresses` | List user's billing addresses. |
| GET | `/user/billing-addresses/:id` | Get a billing address by ID. |
| POST | `/user/billing-addresses` | Create a new billing address. |
| PUT | `/user/billing-addresses/:id` | Update a billing address. |
| DELETE | `/user/billing-addresses/:id` | Delete a billing address. |

---

## Reference Data

| Method | Endpoint | Description |
|---|---|---|
| GET | `/reference/languages` | Get all available languages. |
| GET | `/reference/languages/:id` | Get a language by ID. |
| GET | `/reference/categories` | Get all game categories. |
| GET | `/reference/categories/:id` | Get a category by ID. |
| GET | `/reference/genres` | Get all game genres. |
| GET | `/reference/genres/:id` | Get a genre by ID. |

---

## Games

| Method | Endpoint | Description |
|---|---|---|
| GET | `/games` | Paginated list of games with filters and sorting. |
| GET | `/games/:appId` | Get detailed information about a game. |
| GET | `/games/search` | Full-text search for games. |
| GET | `/games/search/autocomplete` | Autocomplete suggestions for game search. |
| GET | `/games/featured` | Get featured/promoted games. |
| GET | `/games/recommended` | Personalized recommendations (optional auth). |
| GET | `/games/discounted` | List games currently on discount. |
| GET | `/games/newest` | Newest games added to the platform. |
| GET | `/games/genre/:genreId` | List games by genre. |
| GET | `/games/category/:categoryId` | List games by category. |
| GET | `/games/:appId/reviews` | List reviews for a game. |
| GET | `/games/:appId/review/me` | Get current user's review for a game. |

---

## Cart

| Method | Endpoint | Description |
|---|---|---|
| GET | `/cart` | Get current user's shopping cart. |
| GET | `/cart/count` | Get number of items in cart. |
| POST | `/cart/items` | Add a game to the cart. |
| DELETE | `/cart/items/:appId` | Remove a game from the cart. |
| DELETE | `/cart` | Clear the cart. |
| POST | `/cart/validate-coupon` | Validate a coupon code. |
| POST | `/cart/checkout` | Checkout the cart and create an order. |

---

## Wishlist

| Method | Endpoint | Description |
|---|---|---|
| GET | `/wishlist` | Get user's wishlist. |
| POST | `/wishlist` | Add a game to wishlist. |
| DELETE | `/wishlist/:appId` | Remove a game from wishlist. |
| GET | `/wishlist/check/:appId` | Check if a game is in wishlist. |

---

## Library

| Method | Endpoint | Description |
|---|---|---|
| GET | `/library` | Get user's owned games (library). |
| POST | `/library/review` | Create or update a review for an owned game. |

---

## Orders

| Method | Endpoint | Description |
|---|---|---|
| GET | `/orders` | Get user's order history. |
| GET | `/orders/:id` | Get details for a specific order. |

---

## Payments

| Method | Endpoint | Description |
|---|---|---|
| POST | `/payments` | Create a payment transaction for an order. |

---

## Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check server health/status. |

---

## Notes

- The detailed per-endpoint request/response shapes, authentication requirements, and status codes were removed from this summary as requested. For integration or debugging, refer to the implementation or contact the backend maintainer for sample payloads.


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
