# Database Schema Documentation

## Overview
This document describes the database schema for the Game Shopping E-commerce Platform (PostgreSQL).

## Database: `game_shopping`

---

## Enums

### user_role
- `user` - Regular user
- `admin` - Administrator

### order_status
- `pending` - Order is pending
- `paid` - Order has been paid
- `canceled` - Order was canceled
- `refunded` - Order was refunded
- `failed` - Order failed

### payment_status
- `initiated` - Payment initiated
- `authorized` - Payment authorized
- `captured` - Payment captured
- `failed` - Payment failed
- `refunded` - Payment refunded
- `canceled` - Payment canceled

### coupon_discount_type
- `percentage` - Percentage discount
- `fixed_amount` - Fixed amount discount

---

## Tables

### Core Game Tables

#### games
Primary table for game information (Steam App ID based).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| app_id | int | PRIMARY KEY | Steam App ID |
| name | varchar | NOT NULL | Game name |
| type | varchar | NOT NULL | Game type |
| required_age | smallint | NOT NULL, DEFAULT 0 | Age requirement |
| release_date | timestamp | | Release date |
| recommendations_total | int | NOT NULL, DEFAULT 0 | Total recommendations |
| price_final | decimal(10,2) | NOT NULL | Final price |
| price_org | decimal(10,2) | NOT NULL | Original price |
| discount_percent | int | NOT NULL, DEFAULT 0 | Discount percentage |
| price_currency | char(3) | NOT NULL | Currency code (e.g., USD) |
| platforms_windows | boolean | NOT NULL, DEFAULT false | Available on Windows |
| platforms_mac | boolean | NOT NULL, DEFAULT false | Available on Mac |
| platforms_linux | boolean | NOT NULL, DEFAULT false | Available on Linux |

#### game_descriptions
Game descriptions and media.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| app_id | int | PRIMARY KEY, FK → games | Steam App ID |
| detailed_description | text | | Detailed game description |
| supported_languages | text | | Raw string from dataset |
| website | varchar | | Game website URL |
| header_image | text | | Header image URL |
| background | text | | Background image URL |
| categories | text | | Raw string; also normalized via link table |
| genres | text | | Raw string; also normalized via link table |

#### game_specs
PC system requirements.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| app_id | int | PRIMARY KEY, FK → games | Steam App ID |
| pc_min_os | varchar | | Minimum OS requirement |
| pc_min_processor | varchar | | Minimum processor |
| pc_min_memory | varchar | | Minimum memory |
| pc_min_graphics | varchar | | Minimum graphics |
| pc_min_directx | varchar | | Minimum DirectX version |
| pc_min_network | varchar | | Minimum network requirement |
| pc_min_storage | varchar | | Minimum storage |
| pc_rec_os | varchar | | Recommended OS |
| pc_rec_processor | varchar | | Recommended processor |
| pc_rec_memory | varchar | | Recommended memory |
| pc_rec_graphics | varchar | | Recommended graphics |
| pc_rec_directx | varchar | | Recommended DirectX |
| pc_rec_network | varchar | | Recommended network |
| pc_rec_storage | varchar | | Recommended storage |

---

### Reference Tables

#### languages
Supported languages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Language ID |
| name | varchar | UNIQUE, NOT NULL | Language name |

#### game_languages
Many-to-many relationship between games and languages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| app_id | int | PRIMARY KEY, FK → games | Steam App ID |
| language_id | bigint | PRIMARY KEY, FK → languages | Language ID |

#### developers
Game developers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Developer ID |
| name | varchar | UNIQUE, NOT NULL | Developer name |

#### game_developers
Many-to-many relationship between games and developers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| app_id | int | PRIMARY KEY, FK → games | Steam App ID |
| developer_id | bigint | PRIMARY KEY, FK → developers | Developer ID |

#### publishers
Game publishers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Publisher ID |
| name | varchar | UNIQUE, NOT NULL | Publisher name |

#### game_publishers
Many-to-many relationship between games and publishers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| app_id | int | PRIMARY KEY, FK → games | Steam App ID |
| publisher_id | bigint | PRIMARY KEY, FK → publishers | Publisher ID |

#### genres
Game genres.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Genre ID |
| name | varchar | UNIQUE, NOT NULL | Genre name |

#### game_genres
Many-to-many relationship between games and genres.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| app_id | int | PRIMARY KEY, FK → games | Steam App ID |
| genre_id | bigint | PRIMARY KEY, FK → genres | Genre ID |

#### categories
Game categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Category ID |
| name | varchar | UNIQUE, NOT NULL | Category name |

#### game_categories
Many-to-many relationship between games and categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| app_id | int | PRIMARY KEY, FK → games | Steam App ID |
| category_id | bigint | PRIMARY KEY, FK → categories | Category ID |

---

### User Tables

#### users
User accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | User ID |
| email | varchar | UNIQUE, NOT NULL | User email |
| username | varchar | UNIQUE, NOT NULL | Username |
| password_hash | varchar | NOT NULL | Hashed password |
| role | user_role | NOT NULL, DEFAULT 'user' | User role (user/admin) |
| is_verified | boolean | NOT NULL, DEFAULT false | Email verification status |
| date_of_birth | date | | Date of birth |
| country | varchar | | Country |

#### user_verifications
Email/SMS verification tokens for newly registered users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Verification record ID |
| user_id | bigint | NOT NULL, FK → users | User ID |
| otp_hash | varchar | NOT NULL | Hashed OTP code (never store plain text) |
| delivery_method | varchar | NOT NULL, DEFAULT 'email' | Channel used to deliver OTP (email, sms, etc.) |
| expires_at | timestamp | NOT NULL | Expiration timestamp for this OTP |
| verified_at | timestamp | | Timestamp when OTP was successfully verified |
| attempt_count | smallint | NOT NULL, DEFAULT 0 | Number of verification attempts |
| created_at | timestamp | NOT NULL, DEFAULT (now()) | Timestamp when OTP was generated |

**Indexes:**
- Unique index on `(user_id)` to keep only one active OTP per user
- Index on `expires_at` for quick cleanup of expired OTPs

#### session
Session storage for authenticated users (server-side session store).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| sid    | varchar       | PRIMARY KEY, NOT NULL | Session ID (matches the cookie) |
| sess   | json          | NOT NULL             | Session payload (e.g., {"userId": 1, "role": "admin"}) |
| expire | timestamp(6)  | NOT NULL             | Expiration timestamp for this session |

**Indexes:**
- Primary key on `sid`
- Index on `expire` (`IDX_session_expire`) to quickly find expired sessions

#### user_billing_addresses
User billing addresses.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Address ID |
| user_id | bigint | NOT NULL, FK → users | User ID |
| full_name | varchar | | Full name |
| line1 | varchar | | Address line 1 |
| line2 | varchar | | Address line 2 |
| city | varchar | | City |
| state | varchar | | State/Province |
| postal_code | varchar | | Postal code |
| country | varchar | | Country |

#### user_profiles
User preferences (1:1 with users).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | bigint | PRIMARY KEY, FK → users | User ID |
| prefer_lang_ids | int[] | | Array of language IDs from languages table |
| prefer_genre_ids | int[] | | Array of genre IDs from genres table |
| prefer_cate_ids | int[] | | Array of category IDs from categories table |
| prefer_platforms | varchar[] | | Array of platform codes (windows/mac/linux) |

---

### Shopping Tables

#### carts
User shopping carts (one active cart per user).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Cart ID |
| user_id | bigint | UNIQUE, NOT NULL, FK → users | User ID |
| total_price | decimal(10,2) | NOT NULL, DEFAULT 0 | Total cart price |

#### cart_items
Items in shopping carts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Cart item ID |
| cart_id | bigint | NOT NULL, FK → carts | Cart ID |
| app_id | int | NOT NULL, FK → games | Steam App ID |

**Indexes:**
- Index on `cart_id`
- Unique index on `(cart_id, app_id)`

#### orders
Customer orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Order ID |
| user_id | bigint | NOT NULL, FK → users | User ID |
| total_price | decimal(10,2) | NOT NULL, DEFAULT 0 | Total order price |
| discount_code | varchar | | Discount code applied |
| discount_order | decimal(10,2) | NOT NULL, DEFAULT 0 | Absolute discount on total |
| order_status | order_status | NOT NULL, DEFAULT 'pending' | Order status |
| billing_address_id | bigint | FK → user_billing_addresses | Billing address ID |
| created_at | timestamp | DEFAULT (now()) | Order creation timestamp |
| updated_at | timestamp | DEFAULT (now()) | Order update timestamp |

#### order_items
Items in orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Order item ID |
| order_id | bigint | NOT NULL, FK → orders | Order ID |
| app_id | int | NOT NULL, FK → games | Steam App ID |
| unit_price_paid | decimal(10,2) | NOT NULL | Price of one item at time of purchase |
| discount_percent_applied | int | NOT NULL, DEFAULT 0 | Discount percentage applied |

---

### Payment Tables

#### payment_methods
Available payment methods.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Payment method ID |
| payment_name | varchar | UNIQUE, NOT NULL | Payment method name |

#### payments
Payment records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Payment ID |
| order_id | bigint | NOT NULL, FK → orders | Order ID |
| payment_method_id | bigint | NOT NULL, FK → payment_methods | Payment method ID |
| payment_status | payment_status | NOT NULL, DEFAULT 'initiated' | Payment status |
| payment_price | decimal(10,2) | NOT NULL | Payment amount |
| payment_created | timestamp | DEFAULT (now()) | Payment creation timestamp |

**Indexes:**
- Index on `order_id`

---

### Library & Wishlist Tables

#### user_game_library
Games owned by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Library entry ID |
| user_id | bigint | NOT NULL, FK → users | User ID |
| app_id | int | NOT NULL, FK → games | Steam App ID |
| order_id | bigint | FK → orders | Which order did this come from? |
| added_at | timestamp | DEFAULT (now()) | Date added to library |

**Indexes:**
- Unique index on `(user_id, app_id)`

#### user_wishlist_items
Games in user wishlists.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Wishlist item ID |
| user_id | bigint | NOT NULL, FK → users | User ID |
| app_id | int | NOT NULL, FK → games | Steam App ID |
| added_at | timestamp | DEFAULT (now()) | Date added to wishlist |

**Indexes:**
- Unique index on `(user_id, app_id)`

---

### Review Tables

#### reviews
User game reviews.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Review ID |
| user_id | bigint | NOT NULL, FK → users | User ID |
| app_id | int | NOT NULL, FK → games | Steam App ID |
| review_text | text | | Review text content |
| is_recommended | boolean | NOT NULL | Was the game "Recommended" or "Not Recommended"? |

**Indexes:**
- Index on `app_id`
- Unique index on `(user_id, app_id)`

---

### Coupon Tables

#### coupons
Discount coupons.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Coupon ID |
| code | varchar | UNIQUE, NOT NULL | The code user types, e.g., HOLIDAY10 |
| discount_type | coupon_discount_type | NOT NULL | Discount type (percentage/fixed_amount) |
| value | decimal(10,2) | NOT NULL | e.g., 10 for 10% or 10.00 for $10 |

#### user_coupon_usage
Track coupon usage by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigserial | PRIMARY KEY | Usage record ID |
| user_id | bigint | NOT NULL, FK → users | User ID |
| coupon_id | bigint | NOT NULL, FK → coupons | Coupon ID |
| order_id | bigint | NOT NULL, FK → orders | Which order used this coupon |
| used_at | timestamp | DEFAULT (now()) | Timestamp when coupon was used |

**Indexes:**
- Unique index on `(user_id, coupon_id)`

---

## Relationships Summary

### One-to-Many
- users → carts (1:1, one cart per user)
- users → orders
- users → user_billing_addresses
- users → reviews
- users → user_game_library
- users → user_wishlist_items
- carts → cart_items
- orders → order_items
- orders → payments
- games → game_descriptions (1:1)
- games → game_specs (1:1)

### Many-to-Many
- games ↔ languages (via game_languages)
- games ↔ developers (via game_developers)
- games ↔ publishers (via game_publishers)
- games ↔ genres (via game_genres)
- games ↔ categories (via game_categories)

### One-to-One
- users ↔ user_profiles

---

## Notes
- All timestamps use PostgreSQL's `now()` function
- Primary keys use `bigserial` for scalability
- Foreign key relationships enforce referential integrity
- Indexes are created on foreign keys and frequently queried columns
- The `app_id` from games table is based on Steam App IDs

