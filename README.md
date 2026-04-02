# PRO-WISE — Product Assistance Platform

## Overview
Monorepo for the PRO-WISE Product Assistance Platform containing Web, Mobile, and Backend sub-projects.

## Tech Stack
- **Backend**: Node.js, Sails.js, MongoDB (`sails-mongo`)
- **Web Frontend**: React (Vite)
- **Mobile**: React Native (Expo)
- **Auth**: JWT (access + refresh tokens), bcrypt password hashing

## Prerequisites
- Node.js (v18+)
- MongoDB (running locally or provide `MONGODB_URI`)
- npm

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables** (optional — create `.env` in `/backend`):
   ```env
   PORT=1337
   JWT_SECRET=your_secret_key
   MONGODB_URI=mongodb://localhost:27017/prowise
   ```

## Running the Project

### Backend
```bash
npm run start:server
```
API available at: `http://localhost:1337`

### Web Application
```bash
npm run dev:web
```
Available at: `http://localhost:5173`

### Mobile Application
```bash
npm run start:mobile
```
Scan the QR code with Expo Go.

`npm install` - Installs dependencies.
`npm run start` - Starts the backend server (Sails.js on port 1337).
`npm run reset-db` - Seeds initial database.

### Environment Configuration
- **Web App**: Uses `import.meta.env.VITE_API_URL` (defaults to `http://localhost:1337/api`). Configure via `.env` files in the `web` directory.
- **Mobile App**: Uses `process.env.EXPO_PUBLIC_API_URL` (defaults to `http://10.0.2.2:1337/api` for Android and `http://localhost:1337/api` for iOS). Configure via `.env` in the `mobile` directory.

## Default Admin Account
On first start, the backend seeds:
- **Email**: `admin@prowise.com`
- **Password**: `Admin123!`
- **Role**: Administrator

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login → access + refresh tokens |
| POST | `/api/auth/refresh` | No | Refresh access token |
| GET | `/api/auth/me` | Yes | Get current user profile |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin | Get all users |
| GET | `/api/users/:id` | Admin | Get user by ID |
| PUT | `/api/users/profile` | Yes | Update own profile |
| PUT | `/api/users/:id/role` | Admin | Change user role |
| DELETE | `/api/users/:id` | Admin | Delete user |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | Yes | List products (search, filter, paginate) |
| GET | `/api/products/:id` | Yes | Get product |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| GET | `/api/products/:id/recommendations` | Yes | Get recommendations |

### Companies
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/companies` | Yes | List companies |
| GET | `/api/companies/:id` | Yes | Get company |
| POST | `/api/companies` | Admin | Create company |
| PUT | `/api/companies/:id` | Admin | Update company |
| DELETE | `/api/companies/:id` | Admin | Delete company |

### Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | Yes | List/tree categories |
| GET | `/api/categories/:id` | Yes | Get category |
| POST | `/api/categories` | Admin | Create category |
| PUT | `/api/categories/:id` | Admin | Update category |
| DELETE | `/api/categories/:id` | Admin | Delete category |

## Roles

The application implements strict Role-Based Access Control (RBAC):

1.  **Super Admin (`super_admin`)**: Unrestricted access, platform management.
2.  **Company Admin (`administrator`)**: Company-level oversight, manages their own tenant's data.
3.  **Client (`client`)**: End-users who view devices and guides.

## Search & Embedding Service

PRO-WISE uses a local Python Flask service for semantic embeddings. This powers semantic search, product recommendations, and component-to-product discovery.

### Embedding Model: `BAAI/bge-small-en-v1.5`

| Property | Value |
|----------|-------|
| **Model** | `BAAI/bge-small-en-v1.5` |
| **Parameters** | ~33M |
| **Embedding Dimension** | 384 |
| **Disk Size** | ~130 MB |
| **RAM Usage** | ~300 MB |
| **Hardware Target** | Intel i5 vPro, 16 GB RAM, no GPU |

**Why this model:**
- Significantly better retrieval quality than `all-MiniLM-L6-v2` (+24% on MTEB benchmarks)
- Same 384-dimensional output — drop-in compatible with existing data
- Lightweight enough for CPU-only inference (~20-40ms per query)
- No external API keys required — fully local and private

### Running the Search Service

The search service starts automatically with the backend:
```bash
cd backend
npm run dev          # Starts both Sails.js + Flask search service
```

Or run standalone:
```bash
python backend/search_service/app.py    # Runs on port 5001
```

### Regenerating Embeddings

After model changes or data migration, regenerate all product embeddings:
```bash
cd backend
node scripts/backfill-embeddings.js --force
```

> **Important:** Embeddings from different models are not comparable. Always run `--force` backfill after changing the embedding model.

### Model Role

The embedding model is a **retrieval support system**, not a text generator:
- ✅ Encodes product information into dense vectors for similarity search
- ✅ Powers product-to-product recommendations via cosine similarity
- ✅ Supports component-to-product discovery (reverse lookup)
- ❌ Does NOT generate text, invent products, or act as a chatbot
- ❌ All results come from real database records

## Architecture
```
PRO-WISE/
├── backend/          # Sails.js API server
│   ├── api/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── policies/
│   ├── config/
│   └── search_service/  # Python Flask embedding service
│       └── app.py       # BAAI/bge-small-en-v1.5 model
├── web/              # React + Vite web client
│   └── src/
├── mobile/           # React Native + Expo mobile client
│   └── src/
└── package.json      # Monorepo workspaces
```
