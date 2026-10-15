import React from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';

const CATEGORIES = ['All Categories', 'Electronics', 'Fashion', 'Books', 'Home'];

const SearchBar = ({
  searchTerm,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 mb-8 shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
        {/* Search input */}
        <div className="sm:col-span-6 relative">
          <label htmlFor="search-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Search Catalog
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products by title..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category filter */}
        <div className="sm:col-span-3">
          <label htmlFor="category-select" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span>Category</span>
          </label>
          <select
            id="category-select"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all cursor-pointer font-medium"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat === 'All Categories' ? 'All' : cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Price sort */}
        <div className="sm:col-span-3">
          <label htmlFor="sort-select" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sort by Price</span>
          </label>
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all cursor-pointer font-medium"
          >
            <option value="default">Featured / Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
