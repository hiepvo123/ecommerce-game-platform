import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import Home from './pages/Home';
import GameDetail from './pages/GameDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import AdminDashboard from './pages/Admin/Dashboard';
import OrdersManagement from './pages/Admin/OrdersManagement';
import UsersManagement from './pages/Admin/UsersManagement';
import GamesManagement from './pages/Admin/GamesManagement';
import PendingPayments from './pages/Admin/PendingPayments';
import ReviewsManagement from './pages/Admin/ReviewsManagement';
import SearchGames from './pages/SearchGames';
import Library from './pages/Library';

import PrivateRoute from './components/common/PrivateRoute';
import AddNewGame from './pages/Admin/AddNewGame';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/game/:appId" element={<GameDetail />} />
              <Route path="/search" element={<SearchGames />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/cart"
                element={
                  <PrivateRoute>
                    <Cart />
                  </PrivateRoute>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <PrivateRoute>
                    <Wishlist />
                  </PrivateRoute>
                }
              />
              <Route
                path="/library"
                element={
                  <PrivateRoute>
                    <Library />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <PrivateRoute>
                    <Checkout />
                  </PrivateRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <PrivateRoute>
                    <Orders />
                  </PrivateRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <PrivateRoute>
                    <OrderDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <PrivateRoute>
                    <OrdersManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <PrivateRoute>
                    <UsersManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/reviews"
                element={
                  <PrivateRoute>
                    <ReviewsManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/games"
                element={
                  <PrivateRoute>
                    <GamesManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/games/new"
                element={
                  <PrivateRoute>
                    <AddNewGame />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/payments/pending"
                element={
                  <PrivateRoute>
                    <PendingPayments />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
