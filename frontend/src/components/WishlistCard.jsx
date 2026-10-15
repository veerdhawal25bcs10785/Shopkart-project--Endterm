import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ExternalLink, Heart } from 'lucide-react';

const WishlistCard = ({ product, onRemove }) => {
  const [removing, setRemoving] = useState(false);
  const isOutOfStock = product.stock <= 0;

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    try {
      await onRemove(product._id);
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      setRemoving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
      {/* Product Image */}
      <div className="aspect-square sm:aspect-[4/3] bg-slate-100 relative overflow-hidden flex items-center justify-center">
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

        {/* Floating Category Badge */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-700 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full shadow-xs border border-white/60">
          {product.category}
        </span>

        {/* Floating Wishlist Heart */}
        <button
          onClick={handleRemove}
          disabled={removing}
          title="Remove from Wishlist"
          className="absolute top-3 right-3 bg-white/90 hover:bg-white text-rose-500 hover:text-rose-700 p-2 rounded-full shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 cursor-pointer active:scale-95"
        >
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            className="text-base font-bold text-slate-900 line-clamp-1 mb-1 group-hover:text-indigo-600 transition-colors"
            title={product.name}
          >
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            {product.description || 'No description available.'}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-baseline justify-between mb-3.5">
            <span className="text-lg font-extrabold text-slate-900 tracking-tight">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                isOutOfStock
                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                  : product.stock < 10
                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}
            >
              {isOutOfStock ? 'Out of stock' : `${product.stock} left`}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Link
              to={`/products/${product._id}`}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all shadow-xs hover:shadow"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Details
            </Link>

            <button
              onClick={handleRemove}
              disabled={removing}
              className="w-full flex items-center justify-center gap-1.5 border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-semibold py-2 px-4 rounded-xl transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {removing ? 'Removing...' : 'Remove ♥'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistCard;
