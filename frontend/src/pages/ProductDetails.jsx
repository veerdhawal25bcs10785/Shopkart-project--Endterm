import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Loader2, ShoppingCart } from 'lucide-react';
import { getProductById, getWishlist, toggleWishlist } from '../services/api';
import { useCart } from '../context/CartContext';

const ProductDetails = ({ onWishlistCountChange }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isInCart, getItemQuantity, itemLoading } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedNotice, setAddedNotice] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState(null);

  const inCart = isInCart(id);
  const cartQty = getItemQuantity(id);
  const isAddingToCart = Boolean(itemLoading[id]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    getProductById(id)
      .then((data) => {
        if (isMounted) {
          setProduct(data.product);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error fetching product details:', err);
          if (err.response?.status === 404) {
            setError('Product not found.');
          } else {
            setError('Unable to load product details.');
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    // Check if item is already in user's wishlist
    getWishlist()
      .then((data) => {
        if (isMounted && data.wishlist) {
          const isSaved = data.wishlist.some((item) => item._id === id);
          setIsWishlisted(isSaved);
        }
      })
      .catch(() => {
        // Silently ignore if unauthenticated
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAddToCart = async () => {
    if (isAddingToCart || isOutOfStock) return;
    const result = await addToCart(id);
    if (result.success) {
      setAddedNotice(
        inCart
          ? `Updated in Cart! Current quantity: ${cartQty + 1}`
          : 'Product added to cart!'
      );
      setTimeout(() => setAddedNotice(''), 3000);
    } else {
      if (result.status === 401) {
        alert('Please log in to add products to your cart.');
        navigate('/login');
      } else {
        alert(result.error || 'Failed to add product to cart.');
      }
    }
  };

  const handleWishlistToggle = async () => {
    if (wishlistLoading) return;
    setWishlistLoading(true);
    setWishlistMessage(null);

    try {
      const res = await toggleWishlist(id);
      const newSavedState = res.saved !== undefined ? res.saved : !isWishlisted;
      setIsWishlisted(newSavedState);
      setWishlistMessage({
        type: 'success',
        text: newSavedState ? '♥ Added to Wishlist' : 'Removed from Wishlist',
      });
      if (onWishlistCountChange) {
        getWishlist()
          .then((data) => {
            if (data.wishlist) onWishlistCountChange(data.wishlist.length);
          })
          .catch(() => {});
      }
      setTimeout(() => setWishlistMessage(null), 3000);
    } catch (err) {
      if (err.response?.status === 401) {
        setWishlistMessage({
          type: 'error',
          text: 'Please log in to save products.',
        });
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setWishlistMessage({
          type: 'error',
          text: err.response?.data?.message || 'Unable to update wishlist.',
        });
        setTimeout(() => setWishlistMessage(null), 3500);
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="inline-flex p-4 rounded-2xl bg-white border border-slate-200 shadow-xs mb-3">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-800 font-semibold text-sm">Loading product details...</p>
        <p className="text-slate-400 text-xs mt-1">Getting product information</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm">
          <div className="w-14 h-14 bg-indigo-50/60 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl border border-indigo-100">
            📦
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{error || 'Product not found'}</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            The requested product could not be found or may have been removed.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center bg-indigo-600 text-white text-xs font-semibold py-2.5 px-5 rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-500/20"
          >
            &larr; Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Breadcrumb Navigation */}
      <div className="mb-6 flex items-center space-x-2 text-xs font-semibold text-slate-400">
        <Link to="/home" className="text-indigo-600 hover:text-indigo-800 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link to="/products" className="text-indigo-600 hover:text-indigo-800 transition-colors">
          Products
        </Link>
        <span>/</span>
        <span className="text-slate-700 truncate max-w-[240px]">{product.name}</span>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 p-6 sm:p-10">
        {/* Product Image */}
        <div className="bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center min-h-[320px] max-h-[460px] border border-slate-100 shadow-inner group">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80';
            }}
          />
        </div>

        {/* Product Details Info */}
        <div className="flex flex-col justify-between py-2">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-block bg-indigo-50 text-indigo-700 text-[11px] font-bold tracking-wide uppercase px-3 py-1 rounded-full border border-indigo-100">
                {product.category}
              </span>
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  isOutOfStock
                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                    : product.stock < 10
                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}
              >
                {isOutOfStock ? '● Out of Stock' : `● ${product.stock} items in stock`}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
              {product.name}
            </h1>

            <div className="text-3xl font-extrabold text-slate-900 mb-6 tracking-tight">
              ₹{product.price.toLocaleString('en-IN')}
            </div>

            <div className="border-t border-b border-slate-100 py-5 mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Product Description
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>

          <div>
            {addedNotice && (
              <div className="mb-3.5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl text-center font-semibold shadow-xs">
                ✓ {addedNotice}
              </div>
            )}

            {wishlistMessage && (
              <div
                className={`mb-3.5 p-3 border text-xs rounded-xl text-center font-semibold shadow-xs ${
                  wishlistMessage.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                {wishlistMessage.text}
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAddingToCart}
              className={`w-full font-semibold py-3.5 px-6 rounded-xl text-xs sm:text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : isAddingToCart
                  ? 'bg-indigo-400 text-white cursor-wait'
                  : inCart
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-500/25'
              }`}
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding to Cart...</span>
                </>
              ) : isOutOfStock ? (
                'Currently Out of Stock'
              ) : inCart ? (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add Another to Cart ({cartQty} in cart)</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className={`w-full mt-3 border font-semibold py-3 px-6 rounded-xl text-xs sm:text-sm tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
                isWishlisted
                  ? 'bg-rose-50/80 hover:bg-rose-100 text-rose-700 border-rose-200'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-indigo-300'
              }`}
            >
              {wishlistLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Wishlist...</span>
                </>
              ) : isWishlisted ? (
                <>
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>Remove from Wishlist</span>
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" />
                  <span>Add to Wishlist</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
