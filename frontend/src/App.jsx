import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import { getMyProfile, getWishlistCount } from './services/api';
import { useCart } from './context/CartContext';
import Logo from './components/Logo';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { refreshCart } = useCart();

  const refreshUser = () => {
    getMyProfile()
      .then((userData) => {
        setCurrentUser(userData);
        if (userData && userData.wishlist) {
          setWishlistCount(userData.wishlist.length);
        } else {
          getWishlistCount()
            .then((data) => setWishlistCount(data.count || 0))
            .catch(() => {});
        }
        refreshCart();
      })
      .catch(() => {
        setCurrentUser(null);
        setWishlistCount(0);
      });
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const handleUserLoaded = (userData) => {
    setCurrentUser(userData);
    if (userData?.wishlist) {
      setWishlistCount(userData.wishlist.length);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setWishlistCount(0);
    refreshCart();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation Bar */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        wishlistCount={wishlistCount}
      />

      {/* Main Page Routing */}
      <main className="flex-1 pb-16">
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login onLoginSuccess={refreshUser} />} />

          {/* Product Discovery Routes */}
          <Route
            path="/products"
            element={<Products onWishlistCountChange={setWishlistCount} />}
          />
          <Route
            path="/products/:id"
            element={
              <ProductDetails onWishlistCountChange={setWishlistCount} />
            }
          />

          {/* Wishlist Route (Lab 04) */}
          <Route
            path="/wishlist"
            element={
              <Wishlist onWishlistCountChange={setWishlistCount} />
            }
          />

          {/* Shopping Cart Route (Lab 05) */}
          <Route path="/cart" element={<Cart />} />

          {/* Checkout & Orders Routes (Lab 06) */}
          <Route path="/checkout" element={<Checkout user={currentUser} />} />
          <Route path="/orders" element={<Orders user={currentUser} />} />
          <Route path="/orders/:id" element={<OrderDetails user={currentUser} />} />
          <Route
            path="/order-success/:id"
            element={<OrderDetails user={currentUser} isSuccessPage={true} />}
          />

          {/* Protected Home Route */}
          <Route
            path="/home"
            element={<Home onUserLoaded={handleUserLoaded} />}
          />

          {/* Default Redirection */}
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </main>

      {/* Modern Minimal Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <Logo size="sm" showTagline={false} />
            <span className="text-slate-300">|</span>
            <span>Next-Gen E-Commerce Experience</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-slate-400">Labs 01–05 Full-Stack Suite</span>
            <span className="text-slate-300">|</span>
            <span className="font-medium text-slate-600">&copy; {new Date().getFullYear()} ShopKart Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
