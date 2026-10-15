import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Loader2, ShoppingCart, Check, ExternalLink } from 'lucide-react';
import { toggleWishlist } from '../services/api';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product, isWishlisted = false, onWishlistChange }) => {
  const navigate = useNavigate();
  const { addToCart, isInCart, getItemQuantity, itemLoading } = useCart();

  const [isSaved, setIsSaved] = useState(isWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  const isOutOfStock = (product.stock || 0) <= 0;
  const inCart = isInCart(product._id);
  const cartQty = getItemQuantity(product._id);
  const isAddingToCart = Boolean(itemLoading[product._id]);

  // Sync saved state if prop changes
  React.useEffect(() => {
    setIsSaved(isWishlisted);
  }, [isWishlisted]);

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (wishlistLoading) return; // Prevent duplicate clicks

    setWishlistLoading(true);
    setStatusMessage(null);

    try {
      const res = await toggleWishlist(product._id);
      const newSavedState = res.saved !== undefined ? res.saved : !isSaved;
      setIsSaved(newSavedState);

      setStatusMessage({
        type: 'success',
        text: newSavedState ? '♥ Added to Wishlist' : 'Removed from Wishlist',
      });

      if (onWishlistChange) {
        onWishlistChange(product._id, newSavedState);
      }

      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Wishlist toggle error:', err);
      const statusCode = err.response?.status;

      if (statusCode === 401) {
        setStatusMessage({
          type: 'error',
          text: 'Please log in to save products.',
        });
        setTimeout(() => navigate('/login'), 1500);
      } else if (statusCode === 409) {
        setIsSaved(true);
        setStatusMessage({
          type: 'success',
          text: '♥ Added to Wishlist',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: err.response?.data?.message || 'Unable to save product. Please try again.',
        });
      }

      setTimeout(() => setStatusMessage(null), 3500);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAddingToCart || isOutOfStock) return;

    setStatusMessage(null);
    const result = await addToCart(product._id);

    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: inCart ? `Updated in Cart (${cartQty + 1})` : 'Added to Cart!',
      });
      setTimeout(() => setStatusMessage(null), 2500);
    } else {
      if (result.status === 401) {
        setStatusMessage({
          type: 'error',
          text: 'Please log in to add products to your cart.',
        });
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setStatusMessage({
          type: 'error',
          text: result.error || 'Unable to add to cart.',
        });
        setTimeout(() => setStatusMessage(null), 3500);
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:border-slate-300/90 hover:-translate-y-1 group relative">
      {/* Product Image & Overlays */}
      <div className="h-52 bg-slate-100 relative overflow-hidden flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80';
          }}
        />

        {/* Category Badge */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs uppercase tracking-wider">
          {product.category}
        </span>

        {/* Top-Right Heart Wishlist Toggle Button */}
        <button
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          aria-label={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
          title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all cursor-pointer backdrop-blur-md ${
            isSaved
              ? 'bg-rose-50 text-rose-500 hover:bg-rose-100'
              : 'bg-white/85 text-slate-400 hover:text-rose-500 hover:bg-white'
          } ${wishlistLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {wishlistLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          ) : (
            <Heart
              className={`w-4 h-4 transition-transform duration-200 hover:scale-110 ${
                isSaved ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/products/${product._id}`} className="block">
            <h3
              className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1.5"
              title={product.name}
            >
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100">
          {/* Price & Stock Badge */}
          <div className="flex items-baseline justify-between mb-3.5">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              ₹{product.price?.toLocaleString('en-IN')}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                isOutOfStock
                  ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                  : product.stock < 10
                  ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
              }`}
            >
              {isOutOfStock ? 'Out of stock' : `${product.stock} units left`}
            </span>
          </div>

          {/* Feedback Message */}
          {statusMessage && (
            <div
              className={`mb-3 py-1.5 px-2.5 rounded-lg text-xs text-center font-medium transition-all ${
                statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Primary CTA: Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAddingToCart}
              className={`w-full text-xs sm:text-sm font-semibold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98] ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : isAddingToCart
                  ? 'bg-indigo-400 text-white cursor-wait'
                  : inCart
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-indigo-500/20 hover:shadow-md'
              }`}
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : isOutOfStock ? (
                <span>Out of Stock</span>
              ) : inCart ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Add Another ({cartQty})</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            {/* Secondary Buttons: View Details & Wishlist */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                to={`/products/${product._id}`}
                className="text-center bg-slate-100 hover:bg-slate-200/80 hover:text-indigo-600 text-slate-800 text-xs font-semibold py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <span>Details</span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
              </Link>

              <button
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className={`text-xs font-semibold py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                  wishlistLoading
                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                    : isSaved
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200/70'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {wishlistLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : isSaved ? (
                  <>
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-3.5 h-3.5 text-slate-400" />
                    <span>Wishlist</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
