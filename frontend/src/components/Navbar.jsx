import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, ShoppingCart, LogOut, User, Package } from 'lucide-react';
import { logoutCustomer, getWishlistCount } from '../services/api';
import { useCart } from '../context/CartContext';
import Logo from './Logo';

const Navbar = ({ user, onLogout, wishlistCount: externalCount }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [wishlistCount, setWishlistCount] = useState(0);
  const { cartCount } = useCart();

  // Sync wishlist with backend on mount, user change, or route change
  useEffect(() => {
    if (user) {
      if (typeof externalCount === 'number') {
        setWishlistCount(externalCount);
      } else {
        getWishlistCount()
          .then((data) => {
            setWishlistCount(data.count || 0);
          })
          .catch(() => {
            setWishlistCount(0);
          });
      }
    } else {
      setWishlistCount(0);
    }
  }, [user, externalCount, location.pathname]);

  const handleLogout = async () => {
    try {
      await logoutCustomer();
    } catch (err) {
      console.error('Logout error:', err);
    }
    if (onLogout) onLogout();
    setWishlistCount(0);
    navigate('/login');
  };

  const isCurrent = (path) => location.pathname === path;

  return (
    <nav className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center space-x-6 sm:space-x-8">
          <Link to="/products" className="block focus:outline-none">
            <Logo size="md" showTagline={true} />
          </Link>

          <div className="hidden sm:flex items-center space-x-1.5 text-sm font-medium">
            <Link
              to="/home"
              className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                isCurrent('/home')
                  ? 'bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-indigo-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              Home
            </Link>
            <Link
              to="/products"
              className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                isCurrent('/products')
                  ? 'bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-indigo-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              Products
            </Link>
            <Link
              to="/wishlist"
              className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-200 ${
                isCurrent('/wishlist')
                  ? 'bg-rose-50 text-rose-700 font-semibold ring-1 ring-rose-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  wishlistCount > 0
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-slate-400'
                }`}
              />
              <span>Wishlist</span>
              {user && wishlistCount > 0 && (
                <span className="bg-rose-500 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full leading-none shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-200 ${
                isCurrent('/cart')
                  ? 'bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-indigo-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <ShoppingCart
                className={`w-4 h-4 ${
                  cartCount > 0 ? 'text-indigo-600' : 'text-slate-400'
                }`}
              />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-indigo-600 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full leading-none shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>
            {user && (
              <Link
                to="/orders"
                className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-200 ${
                  isCurrent('/orders')
                    ? 'bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-indigo-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Package className="w-4 h-4 text-slate-400" />
                <span>Orders</span>
              </Link>
            )}
          </div>
        </div>

        {/* Right: Auth & User Menu */}
        <div className="flex items-center space-x-3 text-sm">
          {user ? (
            <div className="flex items-center space-x-3">
              <Link
                to="/home"
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 transition text-slate-700 border border-slate-200/60"
                title={user.fullName}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {user.fullName ? user.fullName[0] : <User className="w-3.5 h-3.5" />}
                </div>
                <span className="font-semibold text-xs sm:text-sm hidden sm:inline max-w-[120px] truncate text-slate-800">
                  {user.fullName}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                title="Logout"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-full transition cursor-pointer border border-transparent hover:border-rose-100"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-slate-700 hover:text-slate-900 font-semibold px-4 py-1.5 rounded-full hover:bg-slate-100 transition text-xs sm:text-sm"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold px-4 py-1.5 rounded-full shadow-sm shadow-indigo-500/25 hover:shadow-md transition text-xs sm:text-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="sm:hidden flex items-center justify-around border-t border-slate-100 py-2 bg-white/95 px-2 text-xs font-medium">
        <Link
          to="/products"
          className={`flex items-center gap-1 py-1 px-3 rounded-full ${
            isCurrent('/products') ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
          }`}
        >
          Products
        </Link>
        <Link
          to="/wishlist"
          className={`flex items-center gap-1 py-1 px-3 rounded-full ${
            isCurrent('/wishlist') ? 'bg-rose-50 text-rose-700 font-semibold' : 'text-slate-600'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span>Wishlist {wishlistCount > 0 && `(${wishlistCount})`}</span>
        </Link>
        <Link
          to="/cart"
          className={`flex items-center gap-1 py-1 px-3 rounded-full ${
            isCurrent('/cart') ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Cart {cartCount > 0 && `(${cartCount})`}</span>
        </Link>
        {user && (
          <Link
            to="/orders"
            className={`flex items-center gap-1 py-1 px-3 rounded-full ${
              isCurrent('/orders') ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Orders</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
