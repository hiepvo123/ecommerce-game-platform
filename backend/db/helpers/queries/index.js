// backend/db/helpers/queries/index.js
/**
 * Central export for all query helpers
 */

const gamesQueries = require('./games');
const usersQueries = require('./users');
const cartsQueries = require('./carts');
const ordersQueries = require('./orders');
const categoriesQueries = require('./categories');
const genresQueries = require('./genres');
const reviewsQueries = require('./reviews');
const libraryQueries = require('./library');
const couponsQueries = require('./coupons');
const userVerificationQueries = require('./userVerification');

module.exports = {
  games: gamesQueries,
  users: usersQueries,
  carts: cartsQueries,
  orders: ordersQueries,
  categories: categoriesQueries,
  genres: genresQueries,
  reviews: reviewsQueries,
  library: libraryQueries,
  coupons: couponsQueries,
  userVerification: userVerificationQueries,
};

