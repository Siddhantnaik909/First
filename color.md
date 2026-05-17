# Smart Hub Integrated Color System
*A comprehensive guide to the professional light-mode aesthetic used across the Smart Hub platform.*

This document catalogs every color token, variable, and hardcoded value used to maintain the premium, high-contrast, and professional aesthetic of the Smart Hub ecosystem.

---

## 1. Global Brand Palette
Stored as primary CSS variables in `design-system.css`.

| Variable | Hex Value | RGB / Alpha | Purpose |
| :--- | :--- | :--- | :--- |
| `--primary` | `#c96f32` | `rgb(201, 111, 50)` | Primary Brand Identity (Buttons, Links) |
| `--primary-container` | `#2f9c95` | `rgb(47, 156, 149)` | Secondary Gradient / Tool Accents |
| `--primary-gradient` | `linear-gradient` | `135deg` | Premium UI Backgrounds & Hover States |
| `--surface-tint` | `#c96f32` | `rgb(201, 111, 50)` | Admin Panel Branding Tint |

---

## 2. Surface & Background Hierarchy
Standardized layering for depth and structure.

| Variable | Hex Value | Purpose |
| :--- | :--- | :--- |
| `--surface` | `#f7f2e8` | Base Background (Main Canvas) |
| `--surface-container` | `#f4dfbe` | Standard Sidebar / Header Backgrounds |
| `--surface-container-low` | `#fbe9cd` | Secondary Surface (Inputs, Dropdowns) |
| `--surface-container-lowest` | `#fff2dd` | High-Contrast Activity Cards |
| `--surface-container-high` | `#e7cda9` | Component Borders & Divider Lines |
| `--white` | `#ffffff` | Pure white (Glassmorphism fallbacks) |

---

## 3. Typography & Content
Optimized for WCAG 2.1 contrast compliance.

| Variable | Hex Value | Usage |
| :--- | :--- | :--- |
| `--on-surface` | `#1f2937` | **Primary Body Text** (Slate 800-900 equivalent) |
| `--on-surface-variant` | `#5c4833` | **Subtext & Captions** (Muted Brown-Grey) |
| `--on-primary` | `#fff5e7` | Text on Primary Buttons |
| `--slate-500` | `#64748b` | System Placeholder Text |
| `--slate-900` | `#0f172a` | Deep Headlines / Admin Focus Text |

---

## 4. Status & Feedback
Standardized alerts used in toast notifications and status indicators.

| Type | Hex Value | Variable |
| :--- | :--- | :--- |
| **Success** | `#10b981` | `--success` |
| **Success BG** | `#d8efe4` | `--success-container` |
| **Error** | `#ef4444` | `--error` |
| **Error BG** | `#fee2e2` | `--error-container` |
| **Warning** | `#f59e0b` | `--warning` |

---

## 5. Specialized Page Themes
Dedicated pallets for specific high-premium routes.

### Login & Authentication (`login.html`, `signup.html`)
*Custom tailwind config extended values*

*   **pine**: `#0f766e` (Auth Primary)
*   **ember**: `#f97316` (Auth Secondary)
*   **ink**: `#1f2937` (Auth Headlines)
*   **mist**: `#eef4f1` (Auth Accents)
*   **Backdrop Blob 1**: `#0f766e` (Alpha 0.15)
*   **Backdrop Blob 2**: `#f97316` (Alpha 0.15)
*   **Glass Surface**: `rgba(255, 255, 255, 0.7)` with `backdrop-filter: blur(20px)`

### Admin Command Center (`AdminDashboard.html`)
*Override palette for command density*

*   **Background**: `linear-gradient(180deg, #efd8ab 0%, #ddb97a 100%)`
*   **Hero Main**: `linear-gradient(145deg, #5e3023 0%, #c96f32 58%, #2f9c95 100%)`
*   **Sidebar Profile BG**: `rgba(249, 233, 200, 0.96)`

### Game & Interactive Hub (`GameLobby.html`)
*Neon/Indigo specialty palette for gaming focus*

*   **Primary (Game)**: `#3525cd` (Rich Indigo)
*   **Primary Container**: `#4f46e5`
*   **Secondary (Game)**: `#4a50c4`
*   **Room Hosting (Card)**: `linear-gradient(to bottom right, #4f46e5, #3730a3)`
*   **Room Join (Card)**: `#0f172a` (Slate 900)


---

## 6. Neutral & Slate Palette
Helper classes used for subtle borders and shadows.

*   **Slate 50**: `#f8fafc`
*   **Slate 100**: `#f1f5f9`
*   **Slate 200**: `#e2e8f0`
*   **Slate 300**: `#cbd5e1`
*   **Slate 400**: `#94a3b8`
*   **Slate 500**: `#64748b`
*   **Slate 800**: `#1e293b`
*   **Slate 900**: `#0f172a`

---

## 7. Interactive Shadows
*Defined in `design-system.css`*

*   **Primary Shadow**: `rgba(201, 111, 50, 0.3)`
*   **Default Aura**: `rgba(15, 23, 42, 0.14)`
*   **Tonal Shadow**: `rgba(166, 112, 57, 0.12)` (Used for dashboard cards)

---

## 9. Specialized Tool & Game Palettes
*Specific colors used within the calculator subdirectories and interactive games.*

### 🎮 3D Game Engine (Racing, Logic)
*High-intensity neon for high-speed engagement*
*   **Track/Void BG**: `#000210` or `#020617` (Deep Space)
*   **Neon Accents**: `#00d2ff` (Cyan Speedo), `#4ade80` (Gas Green)
*   **Danger Zones**: `#e11d48` (Crimson Rails/Crash Screen)
*   **HUD Blur**: `rgba(0, 0, 0, 0.2)` with `backdrop-filter: blur(8px)`

### 🏗️ Construction & Engineering Tools
*Professional / Industrial focus*
*   **Primary Icon Accent**: `#c96f32` (Brand Orange)
*   **Neutral Interface**: `#94a3b8` (Slate 400) for unselected inputs
*   **Calculation Focus**: `rgba(201, 111, 50, 0.05)` (Primary Highlight)

### 🏥 Health & Fitness Calculators
*Clinical yet approachable aesthetic*
*   **Positive Result**: `#10b981` (Emerald 500)
*   **Warning/Caution**: `#f59e0b` (Amber 500)
*   **Badge Tints**: `#d8efe4` (Emerald Tint), `#fee2e2` (Rose Tint)

### 💰 Finance & Business Suite
*Traditional trust-based palette*
*   **Growth/Profit**: `#16a34a` (Safe Green)
*   **Loss/Expense**: `#ba1a1a` (Error Red)
*   **Premium Text**: `#ca8a04` (Gold Accents)

---

## 10. File-by-File Color Usage Audit

*Mapping specific colors to their respective local files.*

### 📄 `design-system.css`
*The source of truth for all global variables.*
*   **Brand Tokens**: `#c96f32` (Primary), `#2f9c95` (Container)
*   **Surface Tokens**: `#f7f2e8`, `#f4dfbe`, `#fbe9cd`, `#e7cda9`, `#fff2dd`
*   **Text Tokens**: `#1f2937` (On-Surface), `#5c4833` (Variant)
*   **Status Tokens**: `#10b981` (Success), `#ef4444` (Error), `#f59e0b` (Warning)
*   **Interactive**: `rgba(201, 111, 50, 0.3)` (Shadow Primary)

### 📄 `index.html`
*Main landing page and tool overview.*
*   **Hero Gradient**: `mix(#c96f32, #2f9c95)`
*   **Stat Cards**: `#f7f2e8` (Base), `#fff2dd` (Lowest)
*   **Highlights**: `#c96f32` (Primary), `rgba(201, 111, 50, 0.1)` (Primary Tint)
*   **Neutral Text**: `#1f2937` (Titles), `#7a614d` (Captions)

### 📄 `AdminDashboard.html`
*High-density administrative interface.*
*   **Sidebar**: `rgba(249, 233, 200, 0.92)` (Warm Glass)
*   **Hero Unit**: `#5e3023` (Deep Brown) to `#c96f32` (Orange) Gradient
*   **Admin Accents**: `#2f9c95` (Teal), `#1f6d64` (Tertiary)
*   **Visual Status**: `#10b981` (Trends), `#ba1a1a` (Crit Errors)

### 📄 `login.html` & `signup.html`
*Standalone glassmorphism authentication flow.*
*   **Primary Action**: `#0f766e` (Auth Pine)
*   **Secondary Action**: `#f97316` (Auth Ember)
*   **Glass Surface**: `rgba(255, 255, 255, 0.7)`
*   **Background Blur**: `rgba(248, 250, 252, 1)` (Slate 50)

### 📄 `GameLobby.html`
*Indigo-themed gaming environment.*
*   **Core Theme**: `#3525cd` (Indigo Primary), `#4f46e5` (Secondary)
*   **Join Button**: `#0f172a` (Slate 900)
*   **Chess Accent**: `#f8fafc` (Slate 50)
*   **Tic-Tac-Toe**: `#fff1f2` (Rose Tint)

### 📄 `settings.html`
*Account management and preferences.*
*   **Page Background**: `linear-gradient(#efd8ab, #ddb97a)`
*   **Warm Cards**: `rgba(249, 233, 200, 0.96)`
*   **Input Fields**: `#f8e8c6` (Soft Straw)
*   **Danger Buttons**: `#fee2e2` (Red Container)

### 📄 `admin.html`
*Analytics and centralized command center.*
*   **Table Borders**: `#e7cda9`
*   **Header Gradient**: `linear-gradient(#c96f32, #2f9c95)`
*   **Hover Highlights**: `rgba(201, 111, 50, 0.08)`

### 🎨 `premium-layout.css`
*Styles for interactive tool and game cards.*
*   **Glass Surface**: `rgba(255, 255, 255, 0.7)`
*   **Card Shadow**: `rgba(0, 0, 0, 0.1)` (Soft Depth)
*   **Button Shadow**: `rgba(139, 92, 246, 0.4)` (Secondary Glow)
*   **Visual Patterns**: `rgba(139, 92, 246, 0.05)` (Soft Purple Radial)

### 🎨 `admin-style.css`
*Legacy and structural administrative components.*
*   **Primary Identity**: `#c96f32` (Brand Orange)
*   **Sidebar Content**: `#9ca3af` (Muted Slate for inactive tabs)
*   **Action Highlights**: `rgba(99, 102, 241, 0.1)` (Selection Overlay)
*   **Danger Actions**: `rgba(239, 68, 68, 0.1)` (Soft Red)

---
*End of Color Audit*


