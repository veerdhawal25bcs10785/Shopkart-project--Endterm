import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  MapPin,
  Lock,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createPaymentOrder, verifyPayment } from '../services/api';
import RazorpayModal from '../components/RazorpayModal';

const Checkout = ({ user }) => {
  const navigate = useNavigate();
  const { cart, loading: cartLoading, subtotal, totalUnits, refreshCart } = useCart();

  // Shipping Address Form State
  const [address, setAddress] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [pendingOrderInfo, setPendingOrderInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Sync user details if loaded later
  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Load Razorpay Checkout script dynamically
  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setRazorpayLoaded(true);
    };
    script.onerror = () => {
      console.warn('Razorpay SDK failed to load from CDN (offline sandbox mode enabled).');
      setRazorpayLoaded(false);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setErrorMsg('');
  };

  const validateForm = () => {
    const errors = {};
    if (!address.fullName.trim()) errors.fullName = 'Full name is required';
    if (!address.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (address.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Enter a valid 10-digit phone number';
    }

    if (!address.addressLine.trim()) errors.addressLine = 'Street address is required';
    if (!address.city.trim()) errors.city = 'City is required';
    if (!address.state.trim()) errors.state = 'State is required';
    if (!address.postalCode.trim()) {
      errors.postalCode = 'PIN / Postal code is required';
    } else if (address.postalCode.replace(/\D/g, '').length < 6) {
      errors.postalCode = 'Enter a valid 6-digit PIN code';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePaymentVerification = async ({
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  }) => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const verifyRes = await verifyPayment({
        orderId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (verifyRes.success) {
        await refreshCart();
        navigate(`/orders/${orderId}?success=true`);
      } else {
        setErrorMsg('Payment verification failed on the server.');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setErrorMsg(
        err.response?.data?.message || 'Payment verification failed on server.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalSuccess = (paymentDetails) => {
    setShowModal(false);
    if (!pendingOrderInfo) return;
    handlePaymentVerification({
      orderId: pendingOrderInfo.orderId,
      razorpay_order_id: paymentDetails.razorpay_order_id,
      razorpay_payment_id: paymentDetails.razorpay_payment_id,
      razorpay_signature: paymentDetails.razorpay_signature,
    });
  };

  const handleModalFailure = (errorData) => {
    setShowModal(false);
    setIsSubmitting(false);
    setErrorMsg(
      `Payment declined or cancelled: ${errorData.description || 'Transaction not completed'}. Your cart items remain safe.`
    );
  };

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (!cart || cart.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      // Step 1: Create pending order and Razorpay order on server
      const paymentOrderData = await createPaymentOrder(address);
      const { orderId, razorpayOrderId, amount, currency, keyId, isMockKey } =
        paymentOrderData;
      setPendingOrderInfo(paymentOrderData);

      // If in Sandbox/Test Mode without a live registered Razorpay merchant key,
      // open our full-fidelity in-app Razorpay modal directly!
      const shouldUseSandboxModal =
        isMockKey ||
        keyId === 'rzp_test_shopkart12345' ||
        !window.Razorpay;

      if (shouldUseSandboxModal) {
        setIsSubmitting(false);
        setShowModal(true);
        return;
      }

      // Step 2: Open official Razorpay Checkout modal if live test keys are configured
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'ShopKart',
        description: `Order #${orderId.toString().slice(-6).toUpperCase()}`,
        order_id: razorpayOrderId,
        image: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png',
        prefill: {
          name: address.fullName,
          email: user?.email || '',
          contact: address.phone,
        },
        theme: {
          color: '#4f46e5',
        },
        handler: async function (response) {
          await handlePaymentVerification({
            orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.warn('Razorpay live checkout failed, offering sandbox fallback:', response.error);
        setIsSubmitting(false);
        setShowModal(true);
      });
      rzp.open();
    } catch (err) {
      console.error('Error initiating checkout:', err);
      setErrorMsg(
        err.response?.data?.message ||
          'Failed to initialize payment. Please check stock or address.'
      );
      setIsSubmitting(false);
    }
  };

  if (!cartLoading && (!cart || cart.length === 0)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-xs">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Cart is Empty</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
          Add some items to your cart before proceeding to checkout.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-sm hover:shadow-md transition"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
        <Link to="/cart" className="hover:text-indigo-600 flex items-center gap-1 transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart</span>
        </Link>
        <span>/</span>
        <span className="text-indigo-600 font-semibold">Checkout & Payment</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Checkout & Shipping
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Complete your shipping address and pay securely via Razorpay Test Gateway.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Razorpay Test Mode</span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 text-rose-700 text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to proceed</p>
            <p className="text-xs text-rose-600 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Shipping Address Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Delivery Address</h2>
                <p className="text-xs text-slate-500">Where should we deliver your order?</p>
              </div>
            </div>

            <form onSubmit={handleProceedToPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={address.fullName}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                      formErrors.fullName
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                  {formErrors.fullName && (
                    <p className="text-rose-600 text-xs mt-1">{formErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={address.phone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                      formErrors.phone
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-rose-600 text-xs mt-1">{formErrors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Address Line / Street / Flat *
                </label>
                <input
                  type="text"
                  name="addressLine"
                  value={address.addressLine}
                  onChange={handleChange}
                  placeholder="e.g. Flat 402, Sunset Heights, MG Road"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                    formErrors.addressLine
                      ? 'border-rose-300 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                {formErrors.addressLine && (
                  <p className="text-rose-600 text-xs mt-1">{formErrors.addressLine}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleChange}
                    placeholder="e.g. Bengaluru"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                      formErrors.city
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                  {formErrors.city && (
                    <p className="text-rose-600 text-xs mt-1">{formErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={handleChange}
                    placeholder="e.g. Karnataka"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                      formErrors.state
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                  {formErrors.state && (
                    <p className="text-rose-600 text-xs mt-1">{formErrors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    PIN Code (6 Digits) *
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={address.postalCode}
                    onChange={handleChange}
                    placeholder="e.g. 560001"
                    maxLength={6}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
                      formErrors.postalCode
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                  {formErrors.postalCode && (
                    <p className="text-rose-600 text-xs mt-1">{formErrors.postalCode}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>256-bit SSL encrypted & secure</span>
                </div>
              </div>
            </form>
          </div>

          {/* End of Left Column */}
        </div>

        {/* Right Column: Order Review & Razorpay Trigger */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3.5 mb-4 flex items-center justify-between">
              <span>Order Review</span>
              <span className="text-xs font-medium text-slate-400">{cart.length} item(s)</span>
            </h2>

            {/* Item Previews */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 mb-4 space-y-3">
              {cart.map((item) => (
                <div key={item.product?._id} className="pt-3 first:pt-0 flex items-center gap-3">
                  <img
                    src={item.product?.image}
                    alt={item.product?.name}
                    className="w-12 h-12 object-cover rounded-xl bg-slate-100 border border-slate-200/60"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-slate-800 truncate">
                      {item.product?.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Qty: {item.quantity} × ₹{item.product?.price?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    ₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-4 mb-6">
              <div className="flex justify-between items-center text-xs">
                <span>Total Items ({totalUnits} units):</span>
                <span className="font-semibold text-slate-900">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Shipping & Handling:</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                  FREE
                </span>
              </div>
              <div className="flex justify-between items-baseline border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-2xl font-extrabold text-indigo-600 tracking-tight">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={isSubmitting || cart.length === 0}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.99] disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹{subtotal.toLocaleString('en-IN')} with Razorpay</span>
                </>
              )}
            </button>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Razorpay Test Gateway</span>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold text-[10px] px-2 py-0.5 rounded-full">
                Test Mode Ready
              </span>
            </div>

            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Truck className="w-4 h-4 text-slate-400" />
              <span>Free Express Delivery Across India</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Fidelity In-App Razorpay Checkout Modal */}
      <RazorpayModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setIsSubmitting(false);
        }}
        orderData={pendingOrderInfo}
        customerInfo={{
          fullName: address.fullName,
          phone: address.phone,
          email: user?.email,
        }}
        onPaymentSuccess={handleModalSuccess}
        onPaymentFailure={handleModalFailure}
      />
    </div>
  );
};

export default Checkout;
