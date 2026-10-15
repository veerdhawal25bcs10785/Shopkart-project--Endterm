# 🛍️ ShopKart Wishlist (Engineering Lab 04) — Complete Guide

> **Production-Style Wishlist Feature Implementation for ShopKart**

---

## 📌 Architecture & Data Design

### 1. MongoDB Relationship: Referencing vs Embedding
In ShopKart, we store product references in the User schema:

```javascript
// models/customer.model.js (and models/user.model.js)
wishlist: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }
]
```

#### Why Referencing Instead of Duplicating/Embedding?
1. **Single Source of Truth**: The `Product` collection retains authority over price, stock, description, and image. If a seller updates the product price or it goes out of stock, the user's wishlist instantly reflects the latest data upon `populate()`.
2. **Storage Efficiency**: We store lightweight 12-byte `ObjectId`s rather than copying redundant product documents.
3. **Data Integrity**: Deletion or changes to product catalog details do not result in stale or desynchronized data in user documents.

---

## 🛠️ API Reference & Contract

| Method | Endpoint | Auth Required | Purpose | Status Codes |
|---|---|:---:|---|---|
| `POST` | `/wishlist/:productId` | ✅ | Add product to wishlist | `200/201`, `400`, `401`, `404`, `409` |
| `GET` | `/wishlist` | ✅ | Get populated wishlist for current user | `200`, `401` |
| `DELETE` | `/wishlist/:productId` | ✅ | Remove product from wishlist | `200`, `400`, `401`, `404` |
| `PATCH` | `/wishlist/:productId/toggle` | ✅ | *(Bonus)* Toggle saved state in wishlist | `200`, `400`, `401`, `404` |
| `GET` | `/wishlist/count` | ✅ | *(Bonus)* Get count of items in wishlist | `200`, `401` |

### Security Principle
- The user ID is **never accepted from the client request body or query parameter** (e.g. `GET /wishlist/:userId` or `{ "userId": "123" }` is prohibited).
- User identity is extracted exclusively from the authenticated JWT session via the `protect` middleware (`req.user._id`).
- Supports both **HttpOnly cookies** (browser frontend) and **`Authorization: Bearer <token>`** (mobile / Postman).

---

## 🖥️ Frontend User Experience

### 1. Product Catalog Cards (`/products`)
- **Default State**: Displays `♡ Wishlist` action button and heart icon.
- **In-Progress State**: Shows `⏳ Saving...` spinner and disables button to prevent duplicate clicks.
- **Success State**: Updates instantly to `♥ Wishlisted` with red filled icon.
- **Error State**: Displays informative error message banner if request fails.
- **Unauthenticated Handling**: Redirects to `/login` if a guest tries to add to wishlist.

### 2. Dedicated Wishlist Page (`/wishlist`)
- **Populated State**: Displays grid of saved cards with product image, title, formatted price (`₹`), category tag, stock badge, `[ View Details ]` button, and `[ Remove ♥ ]` button.
- **Loading State**: Shows animated spinner and `"Loading your wishlist..."`.
- **Empty State**: Renders clean empty card with heart icon, friendly message, and a `[ Browse Products ]` button linking to `/products`.
- **Error State**: Displays error notification with a `[ Try Again ]` retry button.
- **Real-Time Removal**: Removing a product updates the view and navbar count immediately without page refreshes.

### 3. Navbar Integration
- Nav links: `Home | Products | Wishlist (count) | Logout`
- Real-time backend count badge `Wishlist (X)` dynamically retrieved from the server.

---

## 🧪 Testing the APIs

Run the automated test suites:
```bash
cd backend

# Run only Wishlist Lab 04 test suite
npm run test:wishlist

# Run all test suites (Customer Auth + Products + Wishlist)
npm run test:all
```

---

## 🎤 TA Viva / Evaluation Cheat-Sheet

1. **Why do we store `ObjectId` references instead of embedding full product documents?**
   - Products are independent entities whose prices, inventory stock, and details change constantly. Storing `ObjectId` references keeps the `Product` collection as the single source of truth and prevents data desynchronization.

2. **What does `ref: "Product"` tell Mongoose?**
   - It specifies which collection/model Mongoose should query when `.populate('wishlist')` is executed, allowing it to automatically resolve the referenced documents.

3. **Why do we never accept `userId` from the request body or URL params?**
   - Accepting `userId` from the client introduces a critical broken object level authorization (BOLA / IDOR) vulnerability, allowing an attacker to manipulate other users' wishlists. The authenticated user must always be derived securely on the server from the verified JWT.

4. **What HTTP status code is used for duplicate wishlist additions and why?**
   - `409 Conflict`, indicating that the requested resource addition conflicts with the current state of the resource (the item is already saved).

5. **Why should the wishlist persist in MongoDB instead of only client-side state?**
   - The wishlist represents saved user intent that must persist across devices, browser sessions, page reloads, and re-logins.
