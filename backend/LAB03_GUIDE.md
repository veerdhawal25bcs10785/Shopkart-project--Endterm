# ShopKart: Product Catalog & Discovery (Engineering Lab 03)

## 📌 Overview
This lab extends **ShopKart** with a dynamic, data-driven **Product Discovery & Catalog** system:
- **Backend:** Mongoose `Product` model, REST APIs for product creation, retrieval, search, category filtering, and price sorting.
- **Frontend:** Dynamic product listing page (`/products`), real-time search & filter bar, responsive product cards, and detailed product view (`/products/:id`) with loading, error, and empty state handling.

---

## 🛠️ API Reference

### 1. Create Product
- **Method:** `POST /products`
- **Request Body:**
```json
{
  "name": "Mechanical Keyboard",
  "description": "RGB mechanical keyboard with blue switches.",
  "price": 2999,
  "category": "Electronics",
  "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
  "stock": 10
}
```
- **Responses:**
  - `201 Created`: Returns created product object.
  - `400 Bad Request`: Missing fields, price $\le 0$, or stock $< 0$.

### 2. Get All Products (With Search, Category, and Sorting)
- **Method:** `GET /products`
- **Query Parameters:**
  - `?search=keyboard`: Case-insensitive search on product name.
  - `?category=Electronics`: Filters products by category.
  - `?sort=price_asc`: Sorts products by price ascending (**Bonus +10 Marks**).
  - `?sort=price_desc`: Sorts products by price descending (**Bonus +10 Marks**).
  - Combined: `GET /products?search=keyboard&category=Electronics&sort=price_asc`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "count": 2,
  "products": [
    {
      "_id": "67cb1a48c123...",
      "name": "Mechanical Keyboard",
      "description": "RGB mechanical keyboard with blue switches.",
      "price": 2999,
      "category": "Electronics",
      "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
      "stock": 10,
      "createdAt": "2026-09-07T08:15:00.000Z"
    }
  ]
}
```

### 3. Get Single Product by ID
- **Method:** `GET /products/:id`
- **Responses:**
  - `200 OK`: Returns `{ "success": true, "product": { ... } }`.
  - `400 Bad Request`: Invalid MongoDB ObjectId format.
  - `404 Not Found`: Product not found in database.

---

## 📱 Frontend Pages & Components

| Route | Component | Description |
|---|---|---|
| `/products` | [`pages/Products.jsx`](file:///C:/Users/ghorp/.gemini/antigravity/scratch/frontend/src/pages/Products.jsx) | Search bar, category filter, price sorting, and dynamic product grid |
| `/products/:id` | [`pages/ProductDetails.jsx`](file:///C:/Users/ghorp/.gemini/antigravity/scratch/frontend/src/pages/ProductDetails.jsx) | Product image, detailed description, specs, and Add to Cart button |
| — | [`components/ProductCard.jsx`](file:///C:/Users/ghorp/.gemini/antigravity/scratch/frontend/src/components/ProductCard.jsx) | Image, price, stock badge, and "View Details" navigation |
| — | [`components/SearchBar.jsx`](file:///C:/Users/ghorp/.gemini/antigravity/scratch/frontend/src/components/SearchBar.jsx) | Text search, category dropdown, and price sort dropdown |

### UI States Implemented
1. **Loading State:** Displays *"Loading products..."* spinner while network request executes.
2. **Error State:** Displays *"Something went wrong while loading products."* with a retry button if API fails.
3. **Empty State:** Displays *"No products found."* with a reset button if search/category yields 0 results.

---

## 🎓 TA Viva Questions & Layman Answers (Lab 03)

### 1. Why should product data come from MongoDB instead of being hardcoded in React?
* **Layman Answer:**
  If products were hardcoded in React, you would have to edit and redeploy the entire website every time an item goes out of stock or a price changes. Storing it in MongoDB means store managers can add, update, or remove products instantly from a database without touching frontend code.

---

### 2. What is the difference between a URL parameter and a query parameter?
* **Layman Answer:**
  * **URL Parameter (`/products/:id`):** Identifies a specific, single resource. Like an apartment number (`/apartments/402`).
  * **Query Parameter (`/products?category=Electronics&sort=price_asc`):** Filters, searches, or sorts a list of resources. Like filtering a catalog (`/apartments?bedrooms=2`).

---

### 3. When would you use `/products/:id` vs `/products?category=Electronics`?
* **Layman Answer:**
  * Use `/products/:id` when you want to look at **one specific product page** with its full description.
  * Use `/products?category=Electronics` when you want to view a **filtered list of many products** that belong to that category.

---

### 4. How does `.map()` help us render products dynamically?
* **Layman Answer:**
  `.map()` takes the array of product objects coming from MongoDB and transforms each item into a `<ProductCard />` component on screen. Whether the database has 2 products or 200 products, `.map()` automatically loops through and displays all of them without duplicating HTML code.

---

### 5. Why do we need loading and error states in a frontend application?
* **Layman Answer:**
  Because internet requests take time and can sometimes fail.
  * Without a **loading state**, the screen would be completely blank while fetching data, making users think the app is frozen.
  * Without an **error state**, if the server crashes, the user is left wondering what happened instead of seeing a helpful message to retry.

---

### 6. What happens when the backend returns an empty array?
* **Layman Answer:**
  An empty array `[]` means the server is working fine, but no products matched the user's search or filter. The frontend catches this with `products.length === 0` and renders an **Empty State** message (*"No products found"*) instead of showing broken or blank space.

---

### 7. Why should search/filtering be handled by the backend instead of filtering a huge dataset only in React?
* **Layman Answer:**
  If an e-commerce store has 50,000 products, sending all 50,000 items to the user's phone or browser to filter with JavaScript will crash the browser and waste huge amounts of mobile data. Letting MongoDB filter the data on the server means the browser only downloads the 10 or 20 items the user actually searched for.

---

### 8. Why should API/service logic be separated from UI components?
* **Layman Answer:**
  To follow the **Separation of Concerns** principle:
  * UI components (like `Products.jsx`) should only worry about how things look.
  * The service file (`api.js`) handles network requests, URLs, and headers.
  If your backend URL or authentication header ever changes in the future, you only update it once inside `api.js` instead of rewriting code across 15 different page files.
