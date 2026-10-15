import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getWishlist } from '../services/api';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';

const Products = ({ onWishlistCountChange }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedProductIds, setSavedProductIds] = useState([]);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('default');

  // Load existing wishlist items to reflect state on product cards
  useEffect(() => {
    getWishlist()
      .then((data) => {
        if (data.wishlist) {
          const ids = data.wishlist.map((item) => item._id);
          setSavedProductIds(ids);
          if (onWishlistCountChange) {
            onWishlistCountChange(ids.length);
          }
        }
      })
      .catch(() => {
        // Silently ignore if unauthenticated
      });
  }, []);

  const handleWishlistChange = (productId, isSaved) => {
    setSavedProductIds((prev) => {
      const updated = isSaved
        ? [...prev, productId]
        : prev.filter((id) => id !== productId);
      if (onWishlistCountChange) {
        onWishlistCountChange(updated.length);
      }
      return updated;
    });
  };

  const fetchProducts = () => {
    setLoading(true);
    setError('');

    getProducts({ search: searchTerm, category, sort })
      .then((data) => {
        setProducts(data.products || []);
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        setError('Something went wrong while loading products.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, category, sort]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategory('All');
    setSort('default');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Back to Home Link */}
      <div className="mb-6">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-colors bg-white hover:bg-slate-100 border border-slate-200/90 px-3.5 py-1.5 rounded-full shadow-xs"
        >
          <span className="text-slate-400">&larr;</span> Back to Home
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
            Explore Catalog
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Product Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse our hand-picked collection of high quality products
          </p>
        </div>
        {!loading && !error && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 shadow-xs self-start sm:self-end">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            Showing {products.length} {products.length === 1 ? 'product' : 'products'}
          </div>
        )}
      </div>

      {/* Search & Filter Controls */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        category={category}
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
      />

      {/* Loading State */}
      {loading && (
        <div className="py-20 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-white border border-slate-200 shadow-xs mb-3">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-700 font-semibold text-sm">Loading products...</p>
          <p className="text-slate-400 text-xs mt-1">Fetching latest inventory for you</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="max-w-md mx-auto my-12 text-center bg-white border border-rose-200 rounded-3xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <span className="text-xl">⚠️</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Failed to load catalog</h2>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <button
            onClick={fetchProducts}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="max-w-lg mx-auto my-14 text-center bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50/50 text-indigo-400 flex items-center justify-center mx-auto mb-4 text-2xl border border-indigo-100">
            🔍
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No products found.</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Try adjusting your search terms or selecting a different category.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm hover:shadow shadow-indigo-500/20 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              isWishlisted={savedProductIds.includes(product._id)}
              onWishlistChange={handleWishlistChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
