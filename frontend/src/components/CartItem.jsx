import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2, Loader2 } from 'lucide-react';

const CartItem = ({ item, onUpdateQuantity, onRemove, isLoading }) => {
  const { product, quantity } = item;

  if (!product) return null;

  const maxStock = product.stock || 0;
  const isMinQuantity = quantity <= 1;
  const isMaxQuantity = quantity >= maxStock;

  const handleDecrease = () => {
    if (isMinQuantity || isLoading) return;
    onUpdateQuantity(product._id, quantity - 1);
  };

  const handleIncrease = () => {
    if (isMaxQuantity || isLoading) return;
    onUpdateQuantity(product._id, quantity + 1);
  };

  const itemTotal = (product.price || 0) * quantity;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 transition-all duration-200 hover:shadow-md hover:border-slate-300">
      {/* Product Image & Info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-100">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80';
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <span className="inline-block text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full mb-1 uppercase tracking-wide">
            {product.category || 'General'}
          </span>
          <Link
            to={`/products/${product._id}`}
            className="block text-base font-bold text-slate-900 hover:text-indigo-600 truncate transition-colors"
            title={product.name}
          >
            {product.name}
          </Link>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">
            ₹{product.price?.toLocaleString('en-IN')} <span className="font-normal text-slate-400">each</span>
          </div>
          {maxStock <= 5 && (
            <div className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-semibold mt-1.5">
              <span>●</span> Only {maxStock} left in stock
            </div>
          )}
        </div>
      </div>

      {/* Quantity Controls & Totals */}
      <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
        {/* Quantity Controls [-] Qty [+] */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200/90 rounded-xl overflow-hidden shadow-xs bg-slate-50/70">
            <button
              onClick={handleDecrease}
              disabled={isMinQuantity || isLoading}
              aria-label="Decrease quantity"
              title={isMinQuantity ? 'Use remove button to delete' : 'Decrease quantity'}
              className="p-2 sm:p-2.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer active:scale-95"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <span className="w-10 text-center font-bold text-xs sm:text-sm text-slate-900 select-none">
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-indigo-600" />
              ) : (
                quantity
              )}
            </span>

            <button
              onClick={handleIncrease}
              disabled={isMaxQuantity || isLoading}
              aria-label="Increase quantity"
              title={isMaxQuantity ? `Max available stock reached (${maxStock})` : 'Increase quantity'}
              className="p-2 sm:p-2.5 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Item Total Price */}
        <div className="text-right min-w-[90px]">
          <div className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            ₹{itemTotal.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Remove Action */}
        <div>
          <button
            onClick={() => onRemove(product._id)}
            disabled={isLoading}
            title="Remove item from cart"
            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-30 cursor-pointer active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
