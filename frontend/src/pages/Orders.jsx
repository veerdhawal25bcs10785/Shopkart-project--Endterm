import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  ChevronRight,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { getMyOrders } from '../services/api';

const Orders = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      if (err.response?.status !== 401) {
        setError(err.response?.data?.message || 'Could not load your orders.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3.5 h-3.5" />
            Shipped
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            {status || 'Placed'}
          </span>
        );
    }
  };

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800">
            PAID
          </span>
        );
      case 'FAILED':
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100/70 text-rose-800">
            PAYMENT FAILED
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100/70 text-amber-800">
            PAYMENT PENDING
          </span>
        );
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to View Orders</h2>
        <p className="text-slate-500 text-sm mb-6">
          Track your purchases and view order summaries anytime.
        </p>
        <Link
          to="/login?redirect=/orders"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse mb-6" />
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 animate-pulse"
          >
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-16 bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Failed to load orders</h2>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-xs">
          <Package className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Orders Yet</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
          You haven't placed any orders yet. Discover our curated collection and start shopping today!
        </p>
        <Link
          to="/products"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-sm hover:shadow-md transition"
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Orders
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track and review all your purchases on ShopKart ({orders.length} orders placed).
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {orders.map((order) => {
          const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={order._id}
              className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs hover:border-indigo-200 transition"
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </span>
                    {getPaymentBadge(order.paymentStatus)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formattedDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(order.orderStatus)}
                  <Link
                    to={`/orders/${order._id}`}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition py-1.5 px-3 rounded-lg hover:bg-indigo-50"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Items Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {order.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-xl bg-white border border-slate-200/60"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div>
                  <span className="text-slate-400">Ship to: </span>
                  <span className="font-medium text-slate-700">
                    {order.shippingAddress?.fullName}, {order.shippingAddress?.city}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-400">Total:</span>
                  <span className="text-base font-extrabold text-slate-900">
                    ₹{order.totalAmount?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
