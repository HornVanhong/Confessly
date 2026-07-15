# Confessly 💜

**Confessly** is a safe, privacy-first, and fully moderated anonymous confession platform. Users can release their burdens, share secrets, or confess anonymously without signups or tracking. Approved confessions are published to a public feed, reacted to, commented on, and automatically pushed directly to a configured Facebook Page.

Live Production URL: **[https://confessly-m4nn.vercel.app](https://confessly-m4nn.vercel.app)**

---

## 🌟 Key Features

*   **100% Anonymous Sharing**: No accounts, logins, or tracking cookies. Privacy is prioritised.
*   **Facebook Auto-Publishing**: Approved confessions automatically cross-post to your Facebook Page in real time (supporting text posts and Base64 photo attachments converted to binary Blobs).
*   **Facebook Sync-Deletion**: Deleting a flagged confession inside the moderation panel automatically calls the Facebook Graph API to delete the post from your Page!
*   **Database Persistence**: Powered by a robust MySQL backend (perfectly integrated with local **MAMP** stacks or cloud **Railway** databases).
*   **Auto-Migration Schema**: Creates your database and tables (`confessions`, `comments`) automatically on the first server query.
*   **Optimistic UI Updates**: Reactions, comments, and post actions render instantly on the client while executing background database transactions.
*   **Passcode-Protected Moderation Panel**: Accessible via a passcode gate (`admin123`) to review, flag, approve, or permanently delete entries.
*   **Secret Administrative Entrances**:
    1.  **Logo Triple-Click**: Triple-clicking the header logo redirects to `/moderator`.
    2.  **Footer Period Link**: Clicking the final period symbol (`.`) in the footer sentence redirect to `/moderator`.
*   **Responsive Premium Design**: Mobile-first glassmorphism styling, animated responsive menus, and custom dark mode ambient grids.

---

## 🛠️ Technology Stack

*   **Frontend & API Router**: Next.js 16 (App Router) & TypeScript
*   **Styling**: Tailwind CSS v4 & Vanilla CSS
*   **Animations**: Framer Motion
*   **Database**: MySQL & `mysql2` client pool
*   **Icons & Celebrations**: Lucide React & Canvas Confetti

---

## 📂 Database Schema

### 1. `confessions` Table
*   `id` (VARCHAR 255, Primary Key)
*   `content` (TEXT, Not Null)
*   `category` (VARCHAR 50, Not Null)
*   `nickname` (VARCHAR 50, Not Null)
*   `isPublic` (TINYINT 1, Not Null)
*   `status` (VARCHAR 20, Not Null)
*   `createdAt` (VARCHAR 50, Not Null)
*   `reportsCount` (INT, Not Null)
*   `image` (LONGTEXT, Null)
*   `facebookPostId` (VARCHAR 255, Null)
*   `reactions_hug` (INT, Not Null)
*   `reactions_heart` (INT, Not Null)
*   `reactions_sad` (INT, Not Null)
*   `reactions_laugh` (INT, Not Null)
*   `reactions_shocked` (INT, Not Null)

### 2. `comments` Table
*   `id` (VARCHAR 255, Primary Key)
*   `confessionId` (VARCHAR 255, Foreign Key CASCADE ON DELETE)
*   `content` (TEXT, Not Null)
*   `nickname` (VARCHAR 50, Not Null)
*   `createdAt` (VARCHAR 50, Not Null)

---

## 💻 Local Installation & Setup

### Prerequisites
- Install **MAMP** (or XAMPP) to host your MySQL server locally.
- Install Node.js (version 18+).

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/HornVanhong/Confessly.git
cd Confessly
npm install
```

### Step 2: Configure Environment Variables
Create a `.env.local` file at the root of the project:
```env
# Database Configuration (MAMP defaults)
DB_HOST=127.0.0.1
DB_PORT=8889
DB_USER=root
DB_PASSWORD=root
DB_DATABASE=confessly
```

### Step 3: Run Development Server
Make sure your MAMP MySQL server is running. Then execute:
```bash
npm run dev
```
Open **[http://localhost:3002](http://localhost:3002)** in your browser. The database and seed tables will automatically initialize!

---

## ☁️ Deployment Guide

### 1. Cloud Database (Railway / Aiven)
- Create a MySQL Database on **[Railway.app](https://railway.app)** or **[Aiven.io](https://aiven.io)**.
- Retrieve the connection details: Host, Port, Username, Password, Database Name.

### 2. Production Vercel Deployment
- Add a new project on your **[Vercel Dashboard](https://vercel.com/)** and import this repository.
- Navigate to **Project Settings > Environment Variables** and add your cloud credentials:
  *   `DB_HOST`
  *   `DB_PORT`
  *   `DB_USER`
  *   `DB_PASSWORD`
  *   `DB_DATABASE`
- Click **Deploy**. On the very first request to your live site, tables will auto-create on your cloud database!

---

## ✒️ Author

Created by **Horn Vanhong**
- GitHub: [@HornVanhong](https://github.com/HornVanhong)
