# ShopKart: Customer Authentication Service (Backend Engineering Lab 01)

## 📌 Project Overview
Welcome to **ShopKart** — an e-commerce platform backend customer authentication service.
This project implements a secure, production-ready, RESTful customer authentication module following the **Model-View-Controller (MVC)** architectural pattern.

---

## 🛠️ Technology Stack & Constraints Adherence

| Component | Technology Used | Status |
|-----------|-----------------|--------|
| Runtime | Node.js | ✅ Strictly followed |
| Framework | Express.js | ✅ Strictly followed |
| Database | MongoDB & Mongoose | ✅ Strictly followed |
| Password Hashing | bcrypt (`bcryptjs`) | ✅ Strictly followed |
| Token Generation | `jsonwebtoken` (JWT) | ✅ Strictly followed |
| Cookie Management | `cookie-parser` | ✅ Strictly followed |
| Environment Config | `dotenv` | ✅ Standard utility |
| External Auth Frameworks (Passport, Clerk, Firebase, Auth0) | **NONE** | 🚫 100% Custom implementation |

---

## 📁 Project Structure (MVC Architecture)

```text
backend/
│
├── controllers/
│   └── customer.controller.js       # Business logic (register, login, profile, logout, change-password)
│
├── models/
│   └── customer.model.js            # Mongoose Customer schema with bcrypt hash & validations
│
├── routes/
│   └── customer.routes.js           # RESTful API route declarations & middleware binding
│
├── middlewares/
│   └── auth.middleware.js           # JWT verification from HttpOnly cookie & req.user injection
│
├── utils/
│   └── generateToken.js             # JWT signing and secure HttpOnly cookie setup
│
├── test/
│   └── customer.test.js             # Automated end-to-end acceptance tests
│
├── .env                             # Environment variables configuration
├── index.js                         # Application entrypoint & MongoDB connection
├── package.json                     # Project manifest and scripts
├── README.md                        # Documentation and Viva preparation guide
└── ShopKart_Customer_Auth.postman_collection.json # Evaluator Postman collection
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js installed (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017` OR a MongoDB Atlas cluster URI.

### 2. Installation
Navigate to the `backend` directory and install dependencies:
```bash
npm install
```

### 3. Environment Configuration
Verify or update the `.env` file in the root `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shopkart
JWT_SECRET=shopkart_jwt_secret_key_2026_super_secure_lab01
NODE_ENV=development
```

### 4. Running the Server
```bash
# Start the production server
npm start

# Or start in development watch mode
npm run dev
```
The server will run on `http://localhost:5000`.

### 5. Running Automated Tests
```bash
npm test
```

---

## 📡 API Reference & Endpoints

### Summary
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| `POST` | `/customers/register` | Public | Register new customer account |
| `POST` | `/customers/login` | Public | Authenticate customer & set HttpOnly cookie |
| `GET` | `/customers/me` | Protected | Retrieve authenticated customer profile |
| `POST` | `/customers/logout` | Protected | Clear auth cookie & end session |
| `PATCH`| `/customers/change-password` | Protected | **Bonus Challenge (+10 Marks)**: Update password |

---

### 1. Register Customer
- **Method:** `POST`
- **Path:** `/customers/register`
- **Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@gmail.com",
  "password": "john123",
  "phone": "9876543210"
}
```
- **Validation Rules:**
  - All fields are mandatory (`400 Bad Request` if missing).
  - Password must be at least 6 characters (`400 Bad Request` if shorter).
  - Email must be unique (`409 Conflict` if already registered).
  - Password stored in MongoDB is strictly a bcrypt hash (10 rounds).
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Customer registered successfully",
  "customer": {
    "_id": "67c570b5cf8912e753da1234",
    "fullName": "John Doe",
    "email": "john@gmail.com",
    "phone": "9876543210"
  }
}
```

---

### 2. Login Customer
- **Method:** `POST`
- **Path:** `/customers/login`
- **Request Body:**
```json
{
  "email": "john@gmail.com",
  "password": "john123"
}
```
- **Behavior:**
  - Finds customer by email.
  - Compares password using `bcrypt.compare`.
  - Generates JWT with customer ID payload.
  - Stores JWT in an **`HttpOnly` cookie** named `token`.
  - If email not found or password does not match, returns `401 Unauthorized` with generic message: `"Invalid credentials"` (*never reveals which field was incorrect*).
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Login successful"
}
```
- **Response Headers:**
  `Set-Cookie: token=<jwt_string>; Path=/; HttpOnly; SameSite=Strict`

---

### 3. My Profile (Protected)
- **Method:** `GET`
- **Path:** `/customers/me`
- **Authentication:** Valid JWT in HttpOnly cookie `token`
- **Behavior:**
  - `auth.middleware.js` extracts token from `req.cookies.token`.
  - Verifies token signature and expiration.
  - Retrieves customer record excluding password (`-password`).
  - Attaches customer object to `req.user`.
- **Success Response (`200 OK`):**
```json
{
  "_id": "67c570b5cf8912e753da1234",
  "fullName": "John Doe",
  "email": "john@gmail.com",
  "phone": "9876543210"
}
```
- **Failure Response (`401 Unauthorized`):**
```json
{
  "success": false,
  "message": "Unauthorized: No token provided in cookies"
}
```

---

### 4. Logout Customer (Protected)
- **Method:** `POST`
- **Path:** `/customers/logout`
- **Authentication:** Valid JWT in HttpOnly cookie `token`
- **Behavior:**
  - Clears `token` cookie with matching options (`httpOnly: true`, `sameSite: 'strict'`).
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 5. Change Password (Bonus Challenge — +10 Marks)
- **Method:** `PATCH`
- **Path:** `/customers/change-password`
- **Authentication:** Valid JWT in HttpOnly cookie `token`
- **Request Body:**
```json
{
  "oldPassword": "john123",
  "newPassword": "newpassword123"
}
```
- **Behavior:**
  - Verifies old password using `bcrypt.compare`.
  - Validates that new password has at least 6 characters.
  - Hashes new password with bcrypt (10 rounds) and saves to database.
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 🧪 Postman Evaluation

An evaluator-ready Postman Collection is included in the project:
`ShopKart_Customer_Auth.postman_collection.json`

### Steps to Test in Postman:
1. Open **Postman**.
2. Click **Import** (top-left) and select `ShopKart_Customer_Auth.postman_collection.json`.
3. The collection defines a `baseUrl` variable default to `http://localhost:5000`.
4. Execute the requests in sequence:
   - `1. Register Customer`
   - `2. Register - Duplicate Email (Failure 409)`
   - `3. Register - Validation Errors (Failure 400)`
   - `4. Login Customer` (Postman automatically stores the `token` cookie)
   - `5. Login - Invalid Credentials (Failure 401)`
   - `6. My Profile (Protected)` (Sends cookie automatically)
   - `7. Change Password (Bonus +10)`
   - `8. Logout Customer (Protected)` (Clears cookie)
   - Re-run `6. My Profile` $\rightarrow$ Confirms `401 Unauthorized`.

---

## 🎓 TA Viva Questions & Comprehensive Answers

### Question 1: Why do we use `bcrypt` instead of encrypting passwords?
> **Answer:**
> - **Encryption is two-way:** Encrypted text can be decrypted back into plain text using a decryption key. If the server or key is compromised, attackers can decrypt all customer passwords.
> - **Hashing is one-way:** `bcrypt` is a one-way cryptographic hash function; once hashed, the plain text cannot be reverse-engineered.
> - **Salt and Work Factor (Key Stretching):** `bcrypt` automatically generates a random cryptographic salt (preventing rainbow table and dictionary lookup attacks) and incorporates an adjustable cost factor / work rounds (default 10). This deliberate slowness makes brute-force attacks computationally infeasible.

---

### Question 2: What information is typically stored inside a JWT payload?
> **Answer:**
> - A JWT consists of three parts: **Header**, **Payload**, and **Signature**.
> - The **Payload** typically stores non-sensitive customer identifiers (such as the database user ID `id: customer._id` or role permissions `role: 'customer'`) and standard claims like expiration time (`exp`) and issued-at time (`iat`).
> - **Crucial Rule:** Sensitive data like passwords, credit card numbers, or personal identifying credentials must **never** be stored in a JWT payload because the payload is simply Base64URL-encoded (not encrypted) and can be easily decoded and read by anyone who inspects the token.

---

### Question 3: Why is the `HttpOnly` flag important for cookies?
> **Answer:**
> - When a cookie has the `httpOnly: true` attribute, it is accessible **only by the web server** and cannot be read, accessed, or manipulated through client-side JavaScript (e.g. `document.cookie`).
> - This provides critical protection against **Cross-Site Scripting (XSS)** attacks. Even if a malicious script executes on the client browser, it cannot extract or steal the JWT authentication token from the cookie.
> - Combined with `SameSite: 'strict'` and `Secure: true` (in production), it also mitigates Cross-Site Request Forgery (CSRF) and man-in-the-middle packet sniffing.

---

### Question 4: Why should passwords never be returned to the frontend?
> **Answer:**
> - Even when hashed, exposing password hashes to client-side code introduces grave security hazards:
>   1. Hashes can be intercepted across network logs, browser dev tools, proxy caches, or client memory.
>   2. Offline attacks (using hashcat, John the Ripper, or GPU rigs) can crack weaker passwords once the hash is obtained.
>   3. There is zero business justification or functional need for the client application to ever receive a password hash.
> - In our implementation, we use `.select('-password')` and Mongoose's `toJSON` transformation to guarantee passwords are never returned in any response.

---

### Question 5: What is the purpose of authentication middleware?
> **Answer:**
> - Authentication middleware acts as a centralized gatekeeper that intercepts incoming requests before they reach protected controller handlers.
> - It performs three essential duties:
>   1. **Interception & Verification:** Extracts credentials (the JWT from `req.cookies.token`) and verifies authenticity and expiration using the cryptographic secret.
>   2. **Identity Resolution:** Fetches the customer record from MongoDB and attaches it to `req.user` for downstream controllers.
>   3. **Access Control & DRY Principle:** Prevents code duplication by eliminating the need to write token verification logic in every protected endpoint. If authentication fails, it halts request execution immediately with HTTP 401.
