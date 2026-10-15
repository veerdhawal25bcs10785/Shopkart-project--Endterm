# 💳 ShopKart Checkout & Orders (Engineering Lab 06) — Complete Guide

> **Production-Grade Checkout, Razorpay Test Payment Integration, Order Snapshotting & Business Rule Enforcement for ShopKart**

---

## 📌 Architecture & Data Design

### 1. Cart vs Order Data Model
A shopping cart represents **temporary purchase intent** with live, mutable references to the Product catalog.
An **Order** represents **immutable business and legal reality** of a finalized transaction.

```javascript
// models/order.model.js
const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true, // Snapshot price at time of purchase
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        image: {
          type: String,
        },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      addressLine: { type: String },
      addressLine1: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String },
      pincode: { type: String },
      phone: { type: String, required: true },
    },
    totalAmount: {
      type: Number,
      required: true, // Calculated strictly on server
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING',
    },
    orderStatus: {
      type: String,
      enum: ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PLACED',
    },
    status: {
      type: String,
      enum: ['PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING_PAYMENT',
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
  },
  { timestamps: true }
);
```

#### Why Snapshot Product Name and Price in Order Items?
1. **Historical Integrity**: If a product price increases next month from ₹2,999 to ₹3,499, an order placed today must perpetually reflect ₹2,999.
2. **Catalog Independence**: If a product is updated, renamed, or deleted by an administrator, the historical order record remains intact and auditable.
3. **Legal Compliance**: Tax records, accounting ledgers, and consumer receipts require the exact monetary transaction details captured at purchase time.

---

## 🛠️ API Reference & Contract

All order endpoints are protected with JWT authentication (`protect` middleware).

| Method | Endpoint | Auth | Purpose | Request Body | Status Codes |
|---|---|:---:|---|---|---|
| `POST` | `/orders/create-payment-order` | ✅ | Validate cart & stock, calculate server total, create pending order and Razorpay order | `{ "shippingAddress": { ... } }` | `201`, `400`, `401`, `500` |
| `POST` | `/orders/verify-payment` | ✅ | Verify HMAC-SHA256 signature, mark PAID, deduct stock, clear user cart | `{ "orderId", "razorpay_order_id", "razorpay_payment_id", "razorpay_signature" }` | `200`, `400`, `401`, `403`, `404` |
| `GET` | `/orders` | ✅ | Get all orders of authenticated user (newest first) | None | `200`, `401` |
| `GET` | `/orders/:id` | ✅ | Get single order details with ownership verification | None | `200`, `400`, `401`, `404` |
| `PATCH` | `/orders/:id/status` | ✅ | Update delivery/order status progression | `{ "orderStatus": "SHIPPED" }` | `200`, `400`, `401`, `404` |

---

## 🔒 Security & Business Rules Enforced

1. **Server-Side Pricing**: Never trust totals or item prices submitted by the frontend. The server independently queries `Product.findById`, multiplies each price by `quantity`, and sums the subtotal.
2. **Pre-Checkout Stock Revalidation**: Cart items can sit in a user's cart for hours or days. The server checks `item.product.stock >= item.quantity` at checkout time before creating an order.
3. **Cryptographic Payment Verification**: Payment validity is never accepted via a boolean flag. The server validates the cryptographic HMAC-SHA256 signature:
   $$\text{HMAC-SHA256}(\text{razorpay\_order\_id} + "|" + \text{razorpay\_payment\_id}, \text{RAZORPAY\_KEY\_SECRET})$$
4. **Delayed Cart Clearing**: The user's cart is never cleared when creating a pending payment order or opening the modal. It is cleared **only** after payment verification succeeds.
5. **Inventory Decrement**: Upon verified payment, the backend updates product inventory: `Product.findByIdAndUpdate(pId, { $inc: { stock: -quantity } })`.
6. **Resource Isolation**: Customers can only inspect their own orders. Attempting to fetch another user's order ID returns `404 Not Found`.

---

## 💳 Razorpay Test Mode Setup

1. Sign up on [razorpay.com](https://razorpay.com) and navigate to **Settings > API Keys** in **Test Mode**.
2. Configure credentials in `backend/.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
   RAZORPAY_KEY_SECRET=yyyyyyyyyyyyyyyy
   ```
3. *Note on offline / sandbox environments*: If testing in an offline environment where the Razorpay CDN script cannot be downloaded, the application automatically provides a built-in sandbox payment simulator button with verified HMAC signature testing.

---

## 🎤 TA Viva Questions & Complete Answers

### Payments
1. **Why must the Razorpay Order be created from the backend?**
   - The backend validates prices, stock, and applies business rules. The Razorpay Orders API requires authentication with `RAZORPAY_KEY_SECRET`, which must never exist in the client.
2. **Why is the Razorpay Key Secret never sent to React?**
   - The Key Secret grants full administrative control over the merchant's payment gateway. Exposing it in frontend JavaScript allows malicious actors to issue refunds, alter accounts, or forge transactions.
3. **Why does Razorpay expect INR amounts in paise?**
   - To eliminate floating-point precision errors that occur when working with decimal numbers. 1 Rupee = 100 paise ($₹2,999 \to 299900$ paise).
4. **What are `razorpay_order_id`, `razorpay_payment_id` and `razorpay_signature`?**
   - `razorpay_order_id`: The ID of the order created upfront by our server on Razorpay.
   - `razorpay_payment_id`: The transaction identifier created when the customer enters their payment method.
   - `razorpay_signature`: The HMAC-SHA256 hash created by Razorpay proving that the payment was processed for that specific order.
5. **Why is signature verification mandatory?**
   - Without signature verification, an attacker could tamper with frontend network requests or simulate a successful callback with a fake `payment_id`, tricking the system into fulfilling unpaid orders.
6. **Why should the cart not be cleared when Checkout merely opens?**
   - The user might cancel the checkout modal, experience a network drop, or have their card declined. Clearing the cart beforehand would cause customer data loss.
7. **What would happen if the client simply sent `paymentSuccess: true`?**
   - Anyone could open DevTools or curl and submit `paymentSuccess: true` to get items shipped for free.

### Orders
8. **Why does an Order store product name and price separately from the Product document?**
   - To preserve a historical snapshot. If the merchant changes product titles or prices in the future, past orders must still display the exact names and prices at the time of purchase.
9. **Why should order price not change when product price changes?**
   - Because the order is a legally binding sales receipt of an already completed transaction.
10. **What is the difference between Cart data and Order data?**
    - Cart data is temporary, mutable, and references live product records. Order data is permanent, immutable, snapshot-based, and associated with payment proof and shipping addresses.
11. **Why should an Order reference the User/Customer?**
    - To enforce ownership isolation, link purchases to account history, and enable order tracking.

### Security & Business Logic
12. **Why should the backend calculate totalAmount?**
    - The server is the authoritative source of truth. Relying on frontend totals allows attackers to tamper with request bodies and purchase items for ₹1.
13. **Why must stock be checked again during checkout?**
    - Stock could have been depleted by other concurrent shoppers between the time the item was added to the cart and when the user clicks "Place Order".
14. **Why should the frontend not send the final order items as trusted data?**
    - The client cannot be trusted. The server loads items directly from the authenticated user's cart in the database.
15. **How do you prevent a user from reading someone else's order?**
    - By verifying `order.customer.toString() === req.user._id.toString()` before returning the order. If it doesn't match, return 404 or 403.

### State Management & React
16. **Why must global cart state be cleared after order creation?**
    - To keep the user interface synchronized with the backend. Once the order is placed, the backend clears the user's cart; the UI must reflect `Cart (0)` without requiring a page refresh.
17. **What happens if the backend order succeeds but frontend state is not updated?**
    - The user will see their old cart items still in the cart and navbar badge, causing confusion and potential duplicate checkout attempts.
18. **Why should cart remain untouched if order creation fails?**
    - To allow the user to rectify payment details or retry without having to find and re-add all items to their cart.
19. **Where should checkout form state live?**
    - In local component state within the Checkout component (or a dedicated form hook), since shipping address input is ephemeral to the checkout page.
20. **What loading states should exist while placing an order?**
    - Button disabling with spinner (`Processing Payment...`), disabled inputs to prevent duplicate submissions, and loading skeleton on the order details page.
21. **What should happen if the cart is empty and a user directly opens `/checkout`?**
    - The page displays an empty state banner with an "Explore Catalog" button directing them to browse products.
