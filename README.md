# Smart Hub - A-Z Technical Documentation & Operations Guide

Welcome to **Smart Hub**, a state-of-the-art full-stack hub featuring 50+ high-fidelity calculators, multiplayer games, an analytics-driven administrative panel, and rich SaaS features. Engineered as a highly responsive, modern progressive web application (PWA), it serves as a robust, single-session utility and social ecosystem.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Architecture & Core Features](#%EF%B8%8F-key-architecture--core-features)
3. [Indian Market Localization](#-indian-market-localization)
4. [Quick Start & Setup Guide](#%EF%B8%8F-quick-start--setup-guide)
5. [Directory Layout](#-directory-layout)
6. [Calculators & Games Index](#-calculators--games-index)
7. [API Routes & Services](#-api-routes--services)
8. [Production Deployment (Render & Atlas)](#-production-deployment-render--atlas)
9. [Troubleshooting & Support](#-troubleshooting--support)

---

## 🌟 Project Overview
Smart Hub consolidates multi-disciplinary mathematical, financial, engineering, and recreational tools into a unified, high-performance web dashboard. 
* **Backend**: Node.js & Express.js server providing secure token-based authentication, user profile management, state recovery, and custom audit logging.
* **Frontend**: Vanilla ES6+ HTML5 and Custom CSS styling with a beautiful, lightweight glassmorphism aesthetic. Responsive layout designed from the ground up for mobile, tablet, and desktop viewports.
* **Database**: MongoDB Atlas / Mongoose schema layering for workspace state persistence and calculation histories.
* **Real-time Engine**: Socket.io engine driving dynamic multiplayer game lobbies.

---

## ⚙️ Key Architecture & Core Features

### 1. Same-Origin Dynamic Routing
We have completely eliminated hardcoded backend production URLs (such as legacy Render host links). The client-side scripts dynamically resolve the host using:
```javascript
window.location.origin
```
This ensures zero-config compatibility across localhost, local area network (LAN) sharing, secure tunnels, and final production domain names.

### 2. Universal Route Rewrite Middleware
The server mounts a custom clean-URL router rewriting rules:
* Removes the `.html` extension from address bars during navigation (e.g. `/login` is internally processed as `/login.html` by the server).
* Standardizes static routes and maps dynamic controller middlewares under the `/api/` prefix.

### 3. Progressive Web App (PWA) Offline Engine
Utilizes custom Service Workers (`sw.js`) with fine-tuned caching logic:
* **HTML/JS/CSS**: Uses `no-cache` revalidation to ensure active code edits load instantly.
* **Media Assets & Fonts**: Cached for 24 hours to secure offline capabilities and visual loading speeds.

### 4. Unified Mobile-Responsive UI Architecture
The entire platform relies on a centralized component-loading system (`auth.js` and `component-loader.js`) ensuring:
* **Global Consistency**: A single source of truth for navigation, footers, and authentication states across 50+ pages.
* **Mobile Responsiveness**: `calc-responsive.css` ensures seamless fluid scaling, proper grid stacking, and safe screen-edge padding on all mobile devices (360px - 768px viewports).

---

## 🇮🇳 Indian Market Localization
Fully audited and customized for the Indian economy and metric standards:
* **Currency Formatting**: Localized standard numbering formatting using `en-IN` (e.g. displaying lakhs and crores as ₹1,00,000).
* **Taxation & Finance slabs**: GST calculations are calibrated against the standard 5%, 12%, 18%, and 28% slabs. Loans compound automatically based on standard Indian bank tenures.
* **Provident Funds**: EPF and PPF tools utilize active RBI and regulatory compounding configurations.
* **System Units**: Standardized to Metric values—meters/kilometers for distance, liters for liquids, and kilograms/Celsius for fitness and thermodynamics.
* **Academic Standards**: Educational utilities fully support CGPA (10-point scale) and SGPA systems used across leading Indian institutions.

---

## ⚡️ Quick Start & Setup Guide

Smart Hub features a unified script pipeline. You can install all modules and start the complete full-stack environment directly from the project root!

### 1. Prerequisites
Ensure you have the following installed on your system:
* **Node.js** (v18.0.0 or higher)
* **MongoDB** (Local instance or a free MongoDB Atlas Cloud cluster)

### 2. Root Installation
From the root directory, simply run:
```bash
npm install
```
> [!NOTE]
> The root setup triggers a `postinstall` script that automatically configures and installs all backend dependencies in the `backend/` subdirectory.

### 3. Configuration
Duplicate the example environment file inside `backend/` and rename it to `.env`:
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and update the variables:
```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/smarthub
JWT_SECRET=your_secure_jwt_secret_token
LOCAL_IP=192.168.29.76
```

### 4. Running the Application
Launch both backend controllers and serving pipelines simultaneously from the root directory:
```bash
# Production Mode
npm start

# Development Mode (Includes auto-reload via Nodemon)
npm run dev
```

The platform is immediately available at:
* **Localhost**: [http://localhost:3000](http://localhost:3000)
* **LAN Sharing**: `http://192.168.x.x:3000` (Displays your auto-detected network IP upon launch)

---

## 📁 Directory Layout
```
New-smart-hub/
├── package.json              # Main root package manager & installation script
├── backend/                  # RESTful Node API & Sockets
│   ├── server.js             # Main server setup & Express server routing
│   ├── package.json          # Backend-specific package configs
│   └── src/
│       ├── routes/           # Routing controllers (auth, games, history)
│       └── models/           # Mongoose schemas (User, CalcHistory)
└── frontend/public/          # Client interfaces & layouts
    ├── calculators/          # 50+ modular high-fidelity HTML calculators
    ├── components/           # Shareable components (navbar, footers)
    ├── css/                  # Global glassmorphism stylesheet system
    └── js/                   # Dynamic API wrappers & socket listeners
```

---

## 🧮 Calculators & Games Index

### 🏠 Construction Suite
1. **Wall Studs (`calc_wall_stud`)**: Advanced calculations for exact spacing, stud layout, and custom framing requirements.
2. **Brick & Mortar (`calc_brick`)**: Estimates required brick quantities and mortar volumes for active construction areas.
3. **Concrete Volume (`calc_concrete`)**: Calculates cubic volumes and structural base weights for foundation slabs.

### 🎮 Multiplayer Gaming Hub
Located at `/GameLobby`, this module drives real-time socket-controlled multiplayer game rooms:
* **Interactive lobbies**: Host or join custom games using alphanumeric room pins.
* **Dynamic Gaming Suite**: Real-time chess rooms, classic Tic-Tac-Toe, and logic challenge grids powered by robust server synchronization.

---

## 🔗 API Routes & Services

All data syncs cleanly via core REST controllers mounted under the `/api` route prefix:

| Prefix | Component | Action |
| :--- | :--- | :--- |
| `/api/auth` | User Identity | Handles login, signup, token validation, and profile updates. |
| `/api/history` | Persistence | Saves user calculation history and loads workspace history logs. |
| `/api/game` | Games Lobby | Handles real-time multiplayer room creation and state synchronization. |
| `/api/admin` | Dashboard | Powers user CRUD operations and server statistics calculations. |

---

## 🚀 Production Deployment (Render & Atlas)

Smart Hub is fully optimized for containerized cloud deployment on **Render**:

### 1. Render Web Service Setup
1. Create a new **Web Service** on Render and connect your repository.
2. Configure settings:
   * **Build Command**: `npm install` (The unified root-level pipeline handles all backend dependencies automatically!)
   * **Start Command**: `npm start`
3. Add the following **Environment Variables** in the Render Dashboard:
   * `MONGO_URI`: Your production MongoDB Atlas connection string.
   * `JWT_SECRET`: A secure key used for signing session tokens.
   * `PORT`: `3000` (Render will map this automatically).
   * `RENDER_EXTERNAL_URL`: Set automatically by Render (our backend's CORS system whitelists this URL and all `*.onrender.com` domains dynamically to prevent any Cross-Origin blocks for both REST API and Socket.io!).

### 2. MongoDB Atlas Configuration
1. Create a free M1/M0 cluster.
2. Navigate to **Network Access** and select **Allow Access from Anywhere** (`0.0.0.0/0`) since Render IP locations dynamically scale during builds.
3. Copy the Atlas connection string and paste it into Render’s `MONGO_URI` field.

### 3. Integrated Security & Diagnostics
* **CORS Protection**: The system automatically whitelists Local Host, LAN IPs, Ngrok, and Render domains.
* **Unmasked Diagnostics**: The `/api/auth/register` endpoint has been upgraded to expose precise database exception messages (such as indexing errors or connection timeouts) directly in client-side alerts, facilitating instant full-stack troubleshooting.

---

## 🆘 Troubleshooting & Support

### ❌ Server Crash: `Cannot find module 'express'`
* **Cause**: You ran `npm install` inside the root but didn't trigger the backend dependency layer, or deployment configurations missed folder variables.
* **Fix**: Run `npm install` again in the root workspace. The configured `postinstall` script will automatically install backend dependencies.

### ❌ Network Sharing Fails
* **Cause**: Windows Inbound Firewall is blocking external port access.
* **Fix**: Open PowerShell as an **Administrator** and run the following command to allow port `3000` access:
```powershell
netsh advfirewall firewall add rule name="SmartHub Port 3000" dir=in action=allow protocol=tcp localport=3000
```
* Ensure both devices are connected to the same local subnet.

---
*Smart Hub Suite — Built for scale, security, and responsive utility.*
