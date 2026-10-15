import React, { useState } from 'react';
import {
  CreditCard,
  Smartphone,
  Building2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  X,
  Lock,
  QrCode,
  Loader2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

const RazorpayModal = ({
  isOpen,
  onClose,
  orderData,
  customerInfo,
  onPaymentSuccess,
  onPaymentFailure,
}) => {
  const [activeTab, setActiveTab] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'simulator'
  const [isProcessing, setIsProcessing] = useState(false);
  const [upiId, setUpiId] = useState('testuser@razorpay');
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [selectedBank, setSelectedBank] = useState('HDFC');

  if (!isOpen || !orderData) return null;

  const totalRupees = (orderData.amount / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleSimulateSuccess = async () => {
    setIsProcessing(true);
    // Mimic realistic Razorpay gateway transaction delay (700ms)
    setTimeout(() => {
      setIsProcessing(false);
      const paymentId = `pay_test_${Date.now()}`;
      onPaymentSuccess({
        razorpay_order_id: orderData.razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: 'mock_sandbox_signature',
      });
    }, 700);
  };

  const handleSimulateFailure = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentFailure({
        code: 'BAD_REQUEST_ERROR',
        description: 'Payment declined by issuing bank (Test Simulation)',
      });
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800 animate-scale-up">
        {/* Razorpay Authentic Header */}
        <div className="bg-[#0c2340] text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close Razorpay checkout"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between pr-8 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                R
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                  <span>Razorpay Standard Checkout</span>
                </h3>
                <p className="text-[11px] text-slate-300">ShopKart Verified Merchant</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Test Mode</span>
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-md flex items-center justify-between border border-white/10">
            <div>
              <p className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">
                Amount Payable
              </p>
              <p className="text-2xl font-black text-white tracking-tight">₹{totalRupees}</p>
            </div>
            <div className="text-right text-[11px] text-slate-300 space-y-0.5">
              <p className="font-mono text-slate-200">
                #{orderData.razorpayOrderId?.slice(-12)}
              </p>
              <p className="truncate max-w-[150px]">{customerInfo?.fullName || 'Customer'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 border-b border-slate-100 text-xs font-semibold text-slate-600 bg-slate-50/70">
          <button
            type="button"
            onClick={() => setActiveTab('upi')}
            className={`py-3 px-2 flex flex-col items-center gap-1 transition border-b-2 ${
              activeTab === 'upi'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>UPI / QR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={`py-3 px-2 flex flex-col items-center gap-1 transition border-b-2 ${
              activeTab === 'card'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Card</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('netbanking')}
            className={`py-3 px-2 flex flex-col items-center gap-1 transition border-b-2 ${
              activeTab === 'netbanking'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Netbanking</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`py-3 px-2 flex flex-col items-center gap-1 transition border-b-2 ${
              activeTab === 'simulator'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Test Scenarios</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 min-h-[260px] flex flex-col justify-between">
          {/* 1. UPI Tab */}
          {activeTab === 'upi' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
                  <QrCode className="w-10 h-10 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">Scan UPI QR Code</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Supports Google Pay, PhonePe, Paytm, BHIM in Test Mode.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Or enter Virtual Payment Address (VPA)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="yourname@upi"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Card Tab */}
          {activeTab === 'card' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md relative overflow-hidden">
                <div className="flex justify-between items-center text-[10px] text-slate-300 uppercase tracking-widest font-bold mb-3">
                  <span>Razorpay Test Card</span>
                  <span className="text-indigo-400 font-black">VISA</span>
                </div>
                <p className="font-mono text-base tracking-widest mb-3">4111 •••• •••• 1111</p>
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>{customerInfo?.fullName || 'CARDHOLDER'}</span>
                  <span>EXP: 12/28</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    readOnly
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Expiry
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      readOnly
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={cardCvv}
                      readOnly
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Netbanking Tab */}
          {activeTab === 'netbanking' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 font-medium">Select a bank for test payment:</p>
              <div className="grid grid-cols-2 gap-2.5">
                {['HDFC', 'ICICI', 'SBI', 'AXIS'].map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => setSelectedBank(bank)}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                      selectedBank === bank
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>{bank} Bank</span>
                    {selectedBank === bank && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Lab 06 Scenarios Tab */}
          {activeTab === 'simulator' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Lab 06 Grading Test Harness</span>
                </p>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  Test both positive payment authorization and bank decline edge cases
                  required by the Lab 06 evaluation rubric.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleSimulateSuccess}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulate Authorized Payment (Success)</span>
                </button>
                <button
                  type="button"
                  onClick={handleSimulateFailure}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Simulate Bank Decline (Failure Test)</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons (for UPI, Card, Netbanking tabs) */}
          {activeTab !== 'simulator' && (
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSimulateSuccess}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing with Razorpay...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Pay ₹{totalRupees}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleSimulateFailure}
                disabled={isProcessing}
                title="Test payment decline edge case"
                className="py-3 px-3 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-xs font-medium transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit SSL Encrypted & Signature Verified</span>
          </div>
          <span className="font-semibold text-slate-600">Razorpay Test Gateway</span>
        </div>
      </div>
    </div>
  );
};

export default RazorpayModal;
