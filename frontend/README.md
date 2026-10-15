# ShopKart: Login → Home Flow (Frontend Engineering Lab 02)

## 📌 Project Overview
This project implements the customer-facing frontend authentication portal for **ShopKart**, integrating with the **Lab 01 backend** service.
Built with **React**, **React Router DOM**, **Axios**, and **Tailwind CSS**, it provides:
- Registration with controlled inputs and validation
- Authentication with HttpOnly cookie handling via `withCredentials: true`
- Protected Customer Home page that validates session via `GET /customers/me`
- Working Navbar with session management and Logout functionality

---

## 🛠️ Technology Stack & Constraints

| Component | Technology | Evaluation Status |
|-----------|------------|-------------------|
| UI Framework | React 18 | ✅ Strictly followed |
| Routing | React Router DOM v6 | ✅ Strictly followed |
| API Client | Axios (`withCredentials: true`) | ✅ Strictly followed |
| Styling | Tailwind CSS | ✅ Clean, responsive modern UI |
| State Management | React Hooks (`useState`, `useEffect`) | ✅ Native React (No Redux needed) |
| Third-Party Auth (Firebase, Clerk, Auth0) | **NONE** | 🚫 100% Custom implementation |

---

## 📁 Project Structure

```text
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx        # Login page (email, password, HttpOnly cookie)
│   │   ├── Register.jsx     # Registration page (fullName, email, password, phone)
│   │   └── Home.jsx         # Protected customer home dashboard
│   │
│   ├── components/
│   │   └── Navbar.jsx       # ShopKart branding, user indicator, Logout button
│   │
│   ├── services/
│   │   └── api.js           # Axios instance configured with withCredentials: true
│   │
│   ├── App.jsx              # React Router DOM routes & shared state
│   ├── main.jsx             # React DOM root render with BrowserRouter
│   └── index.css            # Tailwind directives and custom styles
│
├── index.html               # HTML5 template with modern fonts
├── package.json             # Manifest and dependencies
├── vite.config.js           # Vite dev server configuration & backend proxy
├── tailwind.config.js       # Tailwind theme extensions
└── README.md                # Full documentation and Viva preparation guide
```

---

## 🚀 Setup & Execution Guide

### 1. Prerequisites
Ensure the **ShopKart Backend Service** (Lab 01) is running on port 5000:
```bash
# In backend directory:
cd ../backend
npm start
```
Backend will be live at `http://localhost:5000`.

### 2. Frontend Installation
In the `frontend/` directory:
```bash
npm install
```

### 3. Running the Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:5173`.

### 4. Building for Production
```bash
npm run build
```

---

## 📱 Pages & Workflow

### 1. Registration (`/register`)
- **Fields:** Full Name, Email, Password, Phone Number.
- **Validations:**
  - Mandatory field checks.
  - Password minimum 6 characters.
  - Duplicate email error (`409 Conflict`) displayed inline.
- **Flow:** On success, shows confirmation and redirects to `/login`.

### 2. Login (`/login`)
- **Fields:** Email, Password.
- **Auth:** Sends credentials to `POST /customers/login` with `withCredentials: true`.
- **Security:** In case of bad credentials, displays `"Invalid credentials"` without revealing whether email or password failed.
- **Flow:** On success, redirects to `/home`.

### 3. Protected Home (`/home`)
- **Behavior:** On mount, triggers `GET /customers/me` with cookies.
- **Protection:** If no cookie exists or token is invalid (`401`), automatically redirects to `/login`.
- **Display:** Displays welcome greeting, customer name, email address, phone number, and ShopKart member portal metrics.

### 4. Logout (in Navbar)
- **Behavior:** Triggers `POST /customers/logout` with cookies.
- **Effect:** Backend clears the HttpOnly `token` cookie.
- **Flow:** Resets state and redirects to `/login`.

---

## 🎓 TA Viva Questions & Comprehensive Answers

### Question 1: Why do we use `withCredentials: true`?
> **Answer:**
> - By default, browsers and XMLHttpRequests/fetch do **not** include cross-origin credentials (such as cookies, HTTP authentication, or client SSL certificates) in cross-site HTTP requests to prevent unauthorized cross-site data exposure.
> - Setting `withCredentials: true` explicitly instructs Axios/browser to include cookies (specifically our HttpOnly `token` cookie) with requests made to the backend (e.g. `http://localhost:5000`), and to accept `Set-Cookie` response headers returned by the server.
> - Without `withCredentials: true`, the backend would never receive the `token` cookie in `req.cookies`, causing protected routes like `/customers/me` to fail with `401 Unauthorized`.

---

### Question 2: Why can't JavaScript read an HttpOnly cookie?
> **Answer:**
> - The `HttpOnly` flag is a browser security directive set on the cookie by the server (`Set-Cookie: token=...; HttpOnly`).
> - When present, the browser completely hides the cookie from client-side script environments like `document.cookie` or the Developer Tools console script context.
> - **Why this matters:** If the application has a Cross-Site Scripting (XSS) vulnerability, an attacker's injected script cannot read or exfiltrate the JWT token because JavaScript has no access to `HttpOnly` cookies. The browser handles transmitting the cookie automatically over HTTP requests.

---

### Question 3: Why is `/home` called a protected route?
> **Answer:**
> - `/home` is called "protected" because it is **not publicly accessible** to unauthenticated visitors.
> - Access requires proof of valid authentication (a verified JWT session).
> - If an unauthenticated user navigates directly to `/home`, the component attempts to verify identity via `GET /customers/me`. When the server responds with `401 Unauthorized`, the client immediately redirects the user to `/login`, safeguarding sensitive customer data.

---

### Question 4: Why do we fetch `/customers/me` instead of storing the user manually in `localStorage`?
> **Answer:**
> 1. **Single Source of Truth:** Storing user objects in `localStorage` or `sessionStorage` leads to stale or tampered data. Querying `/customers/me` verifies the current, authoritative database state directly from the server.
> 2. **Session Validity Verification:** Fetching `/customers/me` simultaneously tests whether the HttpOnly cookie is still valid and unexpired on the server. If the session has expired or been revoked, the user is immediately redirected.
> 3. **XSS Protection:** `localStorage` is completely vulnerable to script theft via XSS. Storing sensitive customer data in client storage exposes it, whereas fetching on demand alongside an HttpOnly cookie is significantly more secure.

---

### Question 5: What is the difference between authentication and authorization?
> **Answer:**
> - **Authentication (AuthN) — "Who are you?":**
>   - The process of verifying a user's identity using credentials (such as email and bcrypt-hashed password in `/customers/login`).
>   - Result: Confirms identity and issues a session (JWT cookie).
> - **Authorization (AuthZ) — "What are you allowed to do?":**
>   - The process of verifying whether an authenticated user has permission to access a specific resource or perform an action (e.g., checking if a customer has permission to view their own profile, or whether an admin has permission to delete a product).
>   - Result: Grants or denies access (e.g. `403 Forbidden` vs `200 OK`).
