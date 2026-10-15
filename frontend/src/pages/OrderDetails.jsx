import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  MapPin,
  CreditCard,
  Calendar,
  ArrowLeft,
  ShoppingBag,
  AlertCircle,
  Loader2,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { getOrderById } from '../services/api';

const OrderDetails = ({ user, isSuccessPage = false }) => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isConfirmed = isSuccessPage || searchParams.get('success') === 'true';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrderById(id);
        setOrder(data.order);
      } catch (err) {
        console.error('Failed to load order:', err);
        setError(
          err.response?.data?.message ||
            'Order not found or you do not have permission to view it.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">{error || 'Unable to retrieve this order.'}</p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/orders"
            className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition"
          >
            View My Orders
          </Link>
          <Link
            to="/products"
            className="px-5 py-2.5 rounded-full bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition"
          >
            Go Shopping
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'PLACED', label: 'Order Placed' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const currentStatus = order.orderStatus || order.status || 'PLACED';
  const currentStepIndex = steps.findIndex((s) => s.key === currentStatus);
  const activeStep = currentStepIndex >= 0 ? currentStepIndex : 0;

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </Link>
      </div>

      {/* Success Banner if redirected from checkout */}
      {isConfirmed && (
        <div className="mb-8 p-6 rounded-3xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 text-center animate-fade-in relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Order Placed Successfully!
          </h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-md mx-auto">
            Thank you for shopping with ShopKart! Your payment has been verified and your order is confirmed.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/60 text-xs font-mono font-medium">
            <span>Order Reference: #{order._id.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                Order #{order._id.slice(-8).toUpperCase()}
              </h2>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  order.paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.paymentStatus || 'PENDING'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Placed on {formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Status Stepper */}
        <div className="py-2 mb-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
            Delivery Status
          </p>
          <div className="grid grid-cols-4 gap-2 relative">
            {steps.map((step, idx) => {
              const isPast = idx <= activeStep;
              const isCurrent = idx === activeStep;

              return (
                <div key={step.key} className="text-center relative">
                  <div
                    className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition ${
                      isPast
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <p
                    className={`text-xs mt-2 font-medium ${
                      isCurrent
                        ? 'text-indigo-600 font-bold'
                        : isPast
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Shipping Details */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4 text-slate-900 font-bold text-sm">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <span>Shipping Details</span>
          </div>
          <div className="text-xs text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-900 text-sm">
              {order.shippingAddress?.fullName}
            </p>
            <p>{order.shippingAddress?.addressLine || order.shippingAddress?.addressLine1}</p>
            <p>
              {order.shippingAddress?.city}, {order.shippingAddress?.state} -{' '}
              <span className="font-semibold text-slate-800">
                {order.shippingAddress?.postalCode || order.shippingAddress?.pincode}
              </span>
            </p>
            <p className="pt-2 text-slate-500">
              Phone:{' '}
              <span className="font-semibold text-slate-800">
                {order.shippingAddress?.phone}
              </span>
            </p>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4 text-slate-900 font-bold text-sm">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>Payment Summary</span>
          </div>
          <div className="text-xs text-slate-600 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Gateway:</span>
              <span className="font-semibold text-slate-800">Razorpay Standard</span>
            </div>
            {order.razorpayPaymentId && (
              <div className="flex justify-between">
                <span className="text-slate-400">Razorpay Payment ID:</span>
                <span className="font-mono text-slate-800 text-[11px]">
                  {order.razorpayPaymentId}
                </span>
              </div>
            )}
            {order.razorpayOrderId && (
              <div className="flex justify-between">
                <span className="text-slate-400">Razorpay Order ID:</span>
                <span className="font-mono text-slate-800 text-[11px]">
                  {order.razorpayOrderId}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-bold text-slate-900">
              <span>Total Paid:</span>
              <span className="text-indigo-600 text-base font-extrabold">
                ₹{order.totalAmount?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Purchased Items List */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
          <span>Purchased Items ({order.items?.length || 0})</span>
          <span className="text-xs font-normal text-slate-400">
            Snapshot preserved at purchase time
          </span>
        </h3>

        <div className="divide-y divide-slate-100">
          {order.items?.map((item, idx) => (
            <div key={idx} className="py-3.5 first:pt-0 flex items-center gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-2xl bg-slate-100 border border-slate-200/60"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  ₹{item.price?.toLocaleString('en-IN')} × {item.quantity} unit(s)
                </p>
              </div>
              <div className="text-sm font-bold text-slate-900">
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-4 mt-2 flex justify-between items-baseline text-sm">
          <span className="text-slate-500">Grand Total</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            ₹{order.totalAmount?.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
