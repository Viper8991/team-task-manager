# Team Task Manager

A full-stack, responsive, and visually stunning Team Task Manager web application built with **Node.js/Express**, **React (Vite)**, and **Prisma ORM**. It features a modern glassmorphism design system, role-based access control, an interactive Kanban task board, and statistical progress dashboards.

---

## 🚀 Key Features

*   **Secure Authentication**: Token-based JSON Web Token (JWT) registration and login.
*   **Role-Based Access Control (RBAC)**:
    *   **Admin**: Full management capabilities. Can create/delete projects, add/remove team members, create, edit, assign, and delete tasks.
    *   **Member**: Workspace collaboration. Can browse projects they belong to, see tasks assigned to them, and transition task statuses.
*   **Interactive Kanban Board**: Status columns (`To Do`, `In Progress`, `Under Review`, `Completed`) with dropdown state selectors.
*   **Dashboard Visualizations**: aggregates personal metrics, overdue alerts, and completion rate progress bars for all projects.
*   **Admin Statistics Console**: Special system-wide metric breakdowns for administrators.
*   **Single-Service Deployment**: Configured as a unified service where Express serves the React SPA statically, simplifying deployments and avoiding CORS issues.

---

## 🛠️ Technology Stack

*   **Backend**: Node.js, Express.js, JWT, bcryptjs
*   **Database ORM**: Prisma (configured with SQLite for instant local zero-setup dev, easily swappable to PostgreSQL/MySQL)
*   **Frontend**: React (Vite), React Router v6, Lucide Icons
*   **Styling**: Premium Vanilla CSS (custom properties, HSL color tokens, glassmorphism, responsive grids, custom scrollbars, and keyframe animations)

---

## 📂 Project Structure

```
├── prisma/
│   ├── schema.prisma      # Prisma schema (SQLite configured)
│   └── dev.db             # Generated SQLite DB (after push)
├── src/
│   ├── middleware/
│   │   └── auth.js        # JWT validation & RBAC middlewares
│   ├── routes/
│   │   ├── authRoutes.js  # Auth & profile routes
│   │   ├── projectRoutes.js # Project & member routes
│   │   └── taskRoutes.js  # Task CRUD & dashboard routes
│   ├── prisma.js          # Shared Prisma client wrapper
│   └── server.js          # Express app configurations & static serving
├── frontend/              # Vite React Client
│   ├── src/
│   │   ├── components/    # Reusable UI (Navbar, etc.)
│   │   ├── context/       # AuthContext & API helper
│   │   ├── pages/         # Dashboard, Projects, Login, Signup, Kanban
│   │   ├── index.css      # Core Glassmorphic design system
│   │   └── App.jsx        # Routing and authorization guards
│   ├── vite.config.js     # Dev proxy configuration
│   └── package.json       
├── package.json           # Monorepo scripts and backend dependencies
└── README.md
```

---

## 💻 Local Installation & Setup

Ensure you have **Node.js** (v18+) and **NPM** installed.

### 1. Clone the repository and install dependencies
Initialize the root dependencies and the client dependencies:
```bash
# Installs backend and triggers frontend installation automatically
npm install

# Installs frontend dependencies specifically
npm install --prefix frontend
```

### 2. Initialize the SQLite Database
Synchronize the Prisma models to create a local SQLite database:
```bash
npx prisma db push
```
*(This creates `prisma/dev.db` locally. The first user to register on the application is automatically granted the **ADMIN** role. All subsequent registrations are set to **MEMBER**).*

### 3. Run the Development Server
Launch both the backend API server and the Vite React app concurrently:
```bash
npm run dev
```
*   **Frontend Client**: `http://localhost:5173` (Proxies requests starting with `/api` to the backend)
*   **Backend API**: `http://localhost:3000`

---

## 🌐 Deployment to Railway

This project is optimized for **Railway** as a single unified service. The Express server serves the compiled React application statically from `frontend/dist/`.

### Steps:
1.  **Prepare Production Build locally** (to verify there are no compilation issues):
    ```bash
    npm run build
    ```
2.  Create a project on [Railway](https://railway.app/).
3.  Connect your GitHub repository.
4.  Add the following **Environment Variables** to your service settings:
    *   `PORT`: `3000` (or leave empty, Railway defaults this)
    *   `JWT_SECRET`: `your_custom_long_production_secret`
    *   `DATABASE_URL`: `file:./dev.db` (for simple ephemeral SQLite hosting)
5.  Railway will detect the root `package.json` and build scripts, compile the React frontend, and deploy the application. It will run `npm start` to boot up the unified service.

---

## 🗄️ Transitioning to PostgreSQL (Production Best Practice)

If you prefer a persistent PostgreSQL database on Railway rather than ephemeral SQLite:

1.  In `prisma/schema.prisma`, update the datasource block:
    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```
2.  Locally, if you have PostgreSQL, run:
    ```bash
    npx prisma db push
    ```
3.  In Railway, provision a PostgreSQL database plugin. It will automatically attach the `DATABASE_URL` to your Node.js application, and Prisma will connect to PostgreSQL instead of SQLite with no further code modifications.
