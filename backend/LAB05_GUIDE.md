# 🛒 ShopKart Shopping Cart (Engineering Lab 05) — Complete Guide

> **Production-Style Shopping Cart Feature Implementation for ShopKart with Frontend Global State & Persistent MongoDB Storage**

---

## 📌 Architecture & Data Design

### 1. Cart vs Wishlist Data Model
In Lab 04, a wishlist stored only `Product` references. A shopping cart answers **intent to purchase**, which requires tracking **quantity**:

```javascript
// models/customer.model.js (and user.model.js)
cart: [
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity cannot be less than 1'],
    },
  },
]
```

#### Why Product Details (Price, Title, Stock) Are NOT Duplicated into Cart:
1. **Single Source of Truth**: The `Product` collection is authoritative. If an admin modifies price or inventory changes, `populate()` automatically provides the latest product data.
2. **Preventing Stale Prices**: If a merchant puts an item on sale or raises prices, copying prices into the user document would create pricing inconsistencies.
3. **Dynamic Stock Validation**: Stock must be validated in real-time against `Product.stock` on every add/update operation.

---

## 🛠️ API Reference & Contract

All cart endpoints are protected with JWT authentication (`protect` middleware).

| Method | Endpoint | Auth | Purpose | Request Body | Status Codes |
|---|---|:---:|---|---|---|
| `POST` | `/cart/:productId` | ✅ | Add item or increment quantity if already present | None | `200`, `400` (invalid ID / out of stock / exceeds stock), `401`, `404` |
| `GET` | `/cart` | ✅ | Get current user's populated cart | None | `200`, `401` |
| `PATCH` | `/cart/:productId` | ✅ | Update item quantity | `{ "quantity": number }` | `200`, `400` (invalid qty / exceeds stock), `401`, `404` (not in cart) |
| `DELETE` | `/cart/:productId` | ✅ | Remove product line item from cart | None | `200`, `400` (invalid ID), `401`, `404` (not in cart) |
| `DELETE` | `/cart` | ✅ | Clear entire cart (for checkout / empty) | None | `200`, `401` |

### Key Business Rules Enforced on Backend:
1. **Duplicate Row Prevention**: Adding an existing product increments `quantity` rather than pushing duplicate entries for the same product.
2. **Stock Bound Verification**:
   - Out of stock products cannot be added (`stock <= 0` returns `400`).
   - Adding or patching quantity beyond `product.stock` is rejected with `400 Bad Request`.
3. **Minimum Quantity Bound**: Minimum allowed quantity is `1`. For quantity = 1, users must explicitly use the delete action to remove the product.

---

## 🌐 Frontend State Management (`CartContext`)

Cart data is shared globally across multiple independent components using React Context API:

```text
Product Card (Add to Cart / Add Another)
Cart Page (Quantity [-] [+] / Item Totals / Order Summary)
Navbar (Dynamic Cart (X) Count Badge)
Product Details Page (Add to Cart / Stock Status)
```

### Derived Values (Never Stored in Database)
- **Total Units (Cart Count)**:
  $$\text{totalUnits} = \sum (\text{item.quantity})$$
  Example: 2 Keyboards + 1 Mouse = **Cart (3)**
- **Subtotal**:
  $$\text{subtotal} = \sum (\text{product.price} \times \text{quantity})$$
- **Total Items**: Number of distinct product rows (`cart.length`).

### Individual Item Loading States
`CartContext` tracks loading on a per-product ID basis (`itemLoading[productId]`), ensuring that clicking `+` on Item A does not lock or disable Item B.

---

## 🧪 Testing the APIs

### 1. Automated Test Suite
Run the test suites from the `backend/` directory:
```bash
# Run Cart test suite (24 tests)
npm run test:cart

# Run all test suites (77 tests across Auth, Products, Wishlist, Cart)
npm run test:all
```

### 2. Postman Collection
Import `backend/ShopKart_Cart_Lab05.postman_collection.json` into Postman to test the full lifecycle:
1. Login customer
2. Add new item
3. Add same item again (verify increment)
4. Get populated cart
5. Update quantity
6. Test stock limit violations (expect 400)
7. Remove item
8. Test unauthenticated rejection (expect 401)

---

## 🎤 TA Viva / Evaluation Cheat-Sheet

#### 1. Why does cart state need to be shared globally?
* **Answer:** Multiple decoupled components in different subtrees (the Product Card, the Cart Page, and the Navbar) need simultaneous access to the cart. If state was kept locally in each component, adding a product on the Products page would not update the Navbar counter without a cumbersome manual refetch or page reload.

#### 2. Why should the Navbar not independently fetch the cart?
* **Answer:** Having the Navbar fetch independently causes redundant network requests, race conditions, and out-of-sync states (e.g. Navbar shows 2 while Cart page shows 3). One shared state (`CartContext`) ensures a single source of truth for the entire frontend.

#### 3. What is the difference between server state and frontend state?
* **Answer:** 
  * **Server State:** The persistent ground truth stored in MongoDB, accessed asynchronously via REST APIs, and shared across user sessions/devices.
  * **Frontend State:** Ephemeral in-memory React state (`useState`/`useContext`) that provides instant UI reactivity and optimistic feel. When an API mutation completes, frontend state is synchronized with server response data.

#### 4. What is derived state and why should subtotal not be stored in MongoDB?
* **Answer:** Derived state is data computed synchronously from existing state rather than stored independently. Storing `subtotal` or `cartCount` in MongoDB would create stale data bugs whenever product prices change or discounts apply. Subtotal should always be calculated dynamically as $\sum (\text{price} \times \text{quantity})$.

#### 5. Why does cart need quantity while wishlist does not?
* **Answer:** A wishlist represents an aspirational bookmark ("I like this item"). A shopping cart represents a transactional intention to purchase specific inventory units ("I am buying 3 units of this item now").

#### 6. How do you prevent quantity from exceeding stock?
* **Answer:** In both `addToCart` and `updateCartQuantity`, we query the `Product` collection to retrieve live `product.stock` and verify:
  ```javascript
  if (newQuantity > product.stock) {
    return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock' });
  }
  ```

#### 7. How does the cart count update without refreshing the page?
* **Answer:** `Navbar` consumes `cartCount` directly from `useCart()`. When any component invokes `addToCart`, `updateQuantity`, or `removeFromCart`, the context updates its `cart` state, causing all subscriber components (including `Navbar`) to re-render with the latest count automatically.
