import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';

const Cart = () => {
  const navigate = useNavigate();
  const {
    cart,
    loading,
    error,
    itemLoading,
    totalUnits,
    subtotal,
    updateQuantity,
    removeFromCart,
    refreshCart,
  } = useCart();

  // State 1: Loading State
  if (loading && cart.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <div className="inline-flex p-4 rounded-2xl bg-white border border-slate-200 shadow-xs mb-3">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-800 font-semibold text-sm">Loading your cart...</p>
        <p className="text-slate-400 text-xs mt-1">Retrieving your selected items</p>
      </div>
    );
  }

  // State 2: Error State
  if (!loading && error && cart.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white border border-rose-200 rounded-3xl p-8 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Unable to load your cart.
        </h2>
        <p className="text-sm text-slate-600 mb-6">{error}</p>
        <button
          onClick={refreshCart}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      </div>
    );
  }

  // State 3: Empty Cart State
  if (!loading && cart.length === 0) {
    return (
      <div className="max-w-lg mx-auto my-16 text-center py-14 px-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xs">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
          Your cart is empty 🛒
        </h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-sm mx-auto">
          Looks like you haven't added anything yet. Discover items you love from our catalog and check them out here!
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs tracking-wide py-3 px-6 rounded-xl transition-all shadow-sm hover:shadow shadow-indigo-500/20"
        >
          Browse Products <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // State 4: Populated Cart with Order Summary
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-colors bg-white hover:bg-slate-100 border border-slate-200/90 px-3.5 py-1.5 rounded-full shadow-xs"
        >
          <span className="text-slate-400">&larr;</span> Back to Products
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
            Checkout Bag
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Cart ({totalUnits} {totalUnits === 1 ? 'item' : 'items'})
          </h1>
        </div>
        <p className="text-sm text-slate-500 self-start sm:self-auto">
          Review your items and proceed when ready
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Items List (2 columns on lg) */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <CartItem
              key={item.product?._id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
              isLoading={Boolean(itemLoading[item.product?._id])}
            />
          ))}

          <div className="pt-4 flex justify-between items-center">
            <Link
              to="/products"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              &larr; Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary Sidebar (1 column on lg) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm sticky top-24">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3.5 mb-5 flex items-center justify-between">
            <span>Order Summary</span>
            <span className="text-xs font-normal text-slate-400">{cart.length} unique products</span>
          </h2>

          <div className="space-y-3.5 text-sm text-slate-600 mb-6">
            <div className="flex justify-between items-center">
              <span>Items Total ({totalUnits} units):</span>
              <span className="font-semibold text-slate-900">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Estimated Delivery:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                FREE
              </span>
            </div>
            <div className="border-t border-slate-100 pt-4 flex justify-between items-baseline text-base font-bold text-slate-900">
              <span className="text-slate-800">Subtotal:</span>
              <span className="text-2xl font-extrabold text-indigo-600 tracking-tight">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.99] text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure Checkout with MongoDB Persistence</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
