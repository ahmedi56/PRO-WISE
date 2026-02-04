# Product Assistant

## Overview
Monorepo for the Product Assistant application containing Web, Mobile, and Server sub-projects.

## Prerequisites
- Node.js (v18+)
- npm or yarn

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```
   This will install dependencies for all workspaces (server, web, mobile).

2. **Environment Variables**
   The server uses a default configuration. Create a `.env` file in `/server` if you wish to override:
   ```env
   PORT=3000
   JWT_SECRET=your_secret_key
   ```

## Running the Project

### Server
Start the backend API (Syncs database automatically on start):
```bash
npm run start:server
```
API available at: `http://localhost:3000`

### Web Application
Start the React web interface:
```bash
npm run dev:web
```
Checking: `http://localhost:5173`

### Mobile Application
Start the Expo development server:
```bash
npm run start:mobile
```
Scan the QR code with Expo Go.

## Architecture
- **Backend**: Node.js, Express, Sequelize (SQLite for Dev).
- **Frontend**: React (Vite).
- **Mobile**: React Native (Expo).
- **Authentication**: JWT & Bcrypt.

## Branches
- `main`: Stable release.
- `dev`: Development integration.
- `sprint0`: Current sprint work.
