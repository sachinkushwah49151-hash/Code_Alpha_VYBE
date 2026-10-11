# VYBE — Modern Social Media Platform

> **Connect. Share. Belong.**  
> CodeAlpha Project — Phase 1: Full Consumer Social Redesign & Architecture

---

## 🌟 Overview

**VYBE** is a modern consumer social network built from the ground up for creators, developers, and designers. Engineered with a **content-first philosophy**, VYBE delivers a fluid, editorial experience inspired by modern social products (such as Threads and Instagram) while cultivating its own distinct visual identity.

### Core Design Principles
- **Content First, Minimal Chrome**: Posts are separated by subtle hair-line dividers rather than heavy floating card boxes.
- **Strong Typographic Hierarchy**: Styled with the **Inter** font family, generous line heights, and crisp contrast.
- **Intentional Color Foundation**: Near-white canvas (`#fafafa` / `#ffffff`) grounded by dark charcoal typography (`#0a0a0a`) and an electric brand accent (`#5C49E0`).
- **Responsive Architecture**:
  - **Desktop (≥ 1200px)**: 3-column layout (Compact left navigation + visually dominant center feed + right discovery sidebar).
  - **Tablet (768px – 1199px)**: 2-column layout (Left navigation collapses into icon-only mode; right sidebar is hidden).
  - **Mobile (< 768px)**: Single-column edge-to-edge feed with fixed 5-item bottom navigation bar.

---

## 🚀 Tech Stack

### Frontend (Phase 1)
- **HTML5**: 100% semantic structure (`<article>`, `<nav>`, `<header>`, `<aside>`, `<main>`, `<section>`).
- **CSS3**: CSS Custom Properties (Tokens), CSS Grid & Flexbox, smooth micro-interactions (heartbeat scale, toasts, comment drawers). No Bootstrap, Tailwind, or external frameworks.
- **Vanilla JavaScript**: Pure ES6+ modular code (`main.js`, `feed.js`, `auth.js`, `profile.js`, `explore.js`, `notifications.js`, `messages.js`).
- **SVG Iconography**: Crisp, lightweight inline SVGs with uniform stroke width (`1.75px`).

### Backend Scaffold (Phase 2 Ready)
- **Node.js + Express.js**: REST API scaffold on port `5000` with modular route handlers and controllers.
- **MongoDB + Mongoose**: Pre-configured schema blueprints (`User.js`, `Post.js`).
- **JWT + bcryptjs**: Authentication and password hashing architecture ready for database hookup.

---

## 📁 Directory Structure

```text
VYBE/
├── client/
│   ├── index.html          # Startup product landing page with layered floating post previews
│   ├── feed.html           # Authenticated social home feed with inline composer & 8+ rich posts
│   ├── explore.html        # Visual discovery grid, live search, and trending topics
│   ├── notifications.html  # Activity feed with type filters (All, Mentions, Followers)
│   ├── messages.html       # Split direct messaging (Thread list + real-time chat)
│   ├── profile.html        # Instagram/Threads-style profile, stats, tabs & edit modal
│   ├── create-post.html    # Standalone post composer
│   ├── login.html          # Split-screen auth with brand statement & demo login
│   ├── register.html       # Split-screen onboarding with live username validator
│   ├── css/
│   │   ├── style.css       # Complete CSS design system, typography & components
│   │   └── responsive.css  # Responsive media queries (Desktop, Tablet, Mobile)
│   └── js/
│       ├── main.js         # Shared mock database, state helpers, icons, toasts, nav
│       ├── feed.js         # Post renderer, like toggler, comments drawer, composer
│       ├── auth.js         # Login/register validation, password toggle, demo auth
│       ├── profile.js      # Profile header, tabbed user feeds, edit profile modal
│       ├── explore.js      # Search filter, trending tag click-to-search, suggested follow
│       ├── notifications.js# Notification filters and read/unread state management
│       └── messages.js     # Chat thread switching, message history & live sender
│
├── server/
│   ├── config/db.js        # MongoDB connection configuration
│   ├── controllers/        # Auth, Post, and User controllers
│   ├── middleware/         # JWT verification middleware scaffold
│   ├── models/             # Mongoose schemas (User, Post)
│   ├── routes/             # RESTful API route definitions (/api/auth, /api/posts, /api/users)
│   ├── package.json        # Dependencies (express, cors, mongoose, jsonwebtoken, etc.)
│   └── server.js           # Express API server entry point
│
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
└── README.md               # Project documentation
```

---

## 📱 Page Walkthrough & Interactions

### 1. Home Feed (`index.html`)
- **Inline Composer**: Starts compact (`What's on your mind?`), expands smoothly on focus, enforces 280 character limit with dynamic counter, supports media attachments.
- **Social Posts**: Clean vertical feed. Each item shows author avatar, name, handle, timestamp, content with highlighted `#hashtags`, optional high-res photo, and action row (Like, Comment, Repost, Share).
- **Interactive Actions**:
  - Heart toggles with celebratory scale animation.
  - Comment button slides down a reply drawer with instant reply form.
  - Share button copies link to clipboard with custom toast feedback.
  - Tab switching between *For You* and *Following*.
- **Right Sidebar**: Instant follow/unfollow suggestions and trending hashtags.

### 2. Profile (`profile.html`)
- Centered header featuring 96px avatar, name, handle, bio, and inline metrics (`Posts | Followers | Following`).
- Interactive *Edit Profile* modal allowing instant updates to display name, username, bio, location, and website.
- Tabs for *Posts*, *Media*, and *Liked* posts.

### 3. Explore & Search (`explore.html`)
- Real-time search engine filtering both creators and post contents simultaneously.
- Trending hashtags list (#buildinpublic, #indiedev, #uidesign, etc.) with one-click search population.
- Suggested people grid with follow/unfollow state toggling.
- Ranked popular posts.

### 4. Activity / Notifications (`notifications.html`)
- Chronological list of user interactions (follows, likes, comments, reposts).
- Filter chips: *All*, *Follows*, *Likes*, *Comments*.
- Unread badge indicator and *Mark all read* functionality.

### 5. Direct Messages (`messages.html`)
- Two-panel desktop interface: active conversation threads list on the left, full chat window on the right.
- Real-time message sending with auto-scroll to the latest bubble and instant timestamping.

### 6. Authentication (`login.html` & `register.html`)
- Split-screen visual layout: Left side showcases brand statement and community avatars; right side houses clean form controls.
- Real-time validation with subtle shake animation on input error.
- One-click **⚡ Try Demo Account** button for instant testing.
- Show/hide password visibility toggle.

---

## 💻 Running the Project Locally

### 1. Start the Frontend
The frontend can be served using any static HTTP server. For example:
```bash
# Using Python 3
python -m http.server 3000 --directory VYBE/client
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. Start the Backend Scaffold
```bash
cd VYBE/server
npm install
npm run dev
# Server will launch on port 5000
```
Health endpoint: **[http://localhost:5000/api/health](http://localhost:5000/api/health)**

---

## 🔒 Project Isolation Notice
`VYBE` is completely isolated in the `VYBE/` directory and does not interfere with or share dependencies with any other project in the workspace.
