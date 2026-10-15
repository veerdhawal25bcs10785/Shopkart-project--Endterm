import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile } from '../services/api';

const Home = ({ onUserLoaded }) => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Fetch authenticated customer details
    getMyProfile()
      .then((data) => {
        if (isMounted) {
          setCustomer(data);
          if (onUserLoaded) onUserLoaded(data);
        }
      })
      .catch(() => {
        // If not logged in -> Automatically redirect to /login
        if (isMounted) {
          navigate('/login', { replace: true });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, onUserLoaded]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading your profile...</p>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      {/* Welcome Message */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
          Account Overview
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back, {customer.fullName}!
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          You are successfully logged in to ShopKart. Here are your account details and quick actions:
        </p>
      </div>

      {/* Customer Information Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-500/20">
            {customer.fullName ? customer.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {customer.fullName}
            </h2>
            <p className="text-xs text-slate-500">{customer.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Full Name
            </span>
            <span className="text-slate-900 font-semibold">{customer.fullName}</span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Email Address
            </span>
            <span className="text-slate-900 font-semibold">{customer.email}</span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Phone Number
            </span>
            <span className="text-slate-900 font-semibold">{customer.phone}</span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Customer ID
            </span>
            <span className="text-slate-700 font-mono text-xs break-all">{customer._id}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-medium">Ready to explore products and update your cart?</span>
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.99] text-white font-semibold text-xs py-2.5 px-5 rounded-xl transition-all shadow-sm shadow-indigo-500/25 hover:shadow cursor-pointer"
          >
            <span>Browse Products</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
