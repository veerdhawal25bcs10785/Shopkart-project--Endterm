import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, RefreshCw, AlertCircle, ShoppingBag } from 'lucide-react';
import { getWishlist, removeFromWishlist } from '../services/api';
import WishlistCard from '../components/WishlistCard';

const Wishlist = ({ onWishlistCountChange }) => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removeNotice, setRemoveNotice] = useState('');

  const fetchWishlist = () => {
    setLoading(true);
    setError('');

    getWishlist()
      .then((data) => {
        const items = data.wishlist || [];
        setWishlist(items);
        if (onWishlistCountChange) {
          onWishlistCountChange(items.length);
        }
      })
      .catch((err) => {
        console.error('Error fetching wishlist:', err);
        if (err.response?.status === 401) {
          setError('Please log in to view and manage your wishlist.');
        } else {
          setError(
            err.response?.data?.message || "We couldn't load your wishlist."
          );
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      const updatedWishlist = wishlist.filter(
        (item) => item._id !== productId
      );
      setWishlist(updatedWishlist);

      if (onWishlistCountChange) {
        onWishlistCountChange(updatedWishlist.length);
      }

      setRemoveNotice('Product removed from your wishlist.');
      setTimeout(() => setRemoveNotice(''), 3000);
    } catch (err) {
      console.error('Error removing item from wishlist:', err);
      alert('Unable to remove product from wishlist. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Breadcrumb / Navigation back */}
      <div className="mb-6">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-colors bg-white hover:bg-slate-100 border border-slate-200/90 px-3.5 py-1.5 rounded-full shadow-xs"
        >
          <span className="text-slate-400">&larr;</span> Back to Products
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100 mb-2">
            Saved For Later
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            My Wishlist <Heart className="w-6 h-6 fill-rose-500 text-rose-500 inline" />
          </h1>
          {!loading && !error && wishlist.length > 0 && (
            <p className="text-sm text-slate-500 mt-1">
              You have <span className="font-semibold text-slate-700">{wishlist.length}</span> {wishlist.length === 1 ? 'item' : 'items'} saved in your wishlist
            </p>
          )}
        </div>

        {!loading && !error && wishlist.length > 0 && (
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/60 transition-all self-start sm:self-auto"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Continue Shopping
          </Link>
        )}
      </div>

      {/* Removal Notification Banner */}
      {removeNotice && (
        <div className="mb-6 p-3.5 bg-amber-50/90 border border-amber-200 text-amber-900 text-xs font-medium rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-amber-600 font-bold">✓</span>
            <span>{removeNotice}</span>
          </div>
          <button
            onClick={() => setRemoveNotice('')}
            className="text-amber-700 hover:text-amber-900 text-xs font-bold px-2 py-0.5 rounded-md hover:bg-amber-100/60 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* State 1: Loading State */}
      {loading && (
        <div className="py-24 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-white border border-slate-200 shadow-xs mb-3">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-rose-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-800 font-semibold text-sm">Loading your wishlist...</p>
          <p className="text-slate-400 text-xs mt-1">Fetching your saved products</p>
        </div>
      )}

      {/* State 2: Error State */}
      {!loading && error && (
        <div className="max-w-md mx-auto my-14 text-center bg-white border border-rose-200 rounded-3xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Something went wrong.
          </h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          {error.includes('log in') ? (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs rounded-xl transition shadow-sm shadow-indigo-500/20"
              >
                Sign In to View Wishlist
              </Link>
              <button
                onClick={fetchWishlist}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Again
              </button>
            </div>
          ) : (
            <button
              onClick={fetchWishlist}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          )}
        </div>
      )}

      {/* State 3: Empty Wishlist State */}
      {!loading && !error && wishlist.length === 0 && (
        <div className="max-w-lg mx-auto my-14 text-center py-14 px-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="w-20 h-20 bg-rose-50 border border-rose-100 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xs">
            <Heart className="w-10 h-10 fill-rose-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Your wishlist is empty
          </h2>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-sm mx-auto">
            Save items you like while browsing and revisit them anytime to make a quick purchase.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs tracking-wide py-3 px-6 rounded-xl transition-all shadow-sm hover:shadow shadow-indigo-500/20"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse Products
          </Link>
        </div>
      )}

      {/* State 4: Populated Wishlist Grid */}
      {!loading && !error && wishlist.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
          {wishlist.map((product) => (
            <WishlistCard
              key={product._id}
              product={product}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
