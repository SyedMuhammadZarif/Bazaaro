# Bazaaro Media Platform Setup Instructions

## Project Architecture
This is a **full-stack application** with:
- **Frontend**: Next.js (runs on port 3000)
- **Backend**: Express.js (runs on port 5000)

## Setup Steps

### 1. Install Dependencies
\`\`\`bash
# Install frontend dependencies (in root directory)
npm install

# Install backend dependencies
cd backend
npm install
cd ..
\`\`\`

### 2. Environment Variables
The backend `.env` file has been created with your credentials in `/backend/.env`

### 3. Start the Application

**Option A: Run both servers separately (Recommended for development)**
\`\`\`bash
# Terminal 1: Start backend server
cd backend
npm run dev
# Backend runs on http://localhost:5000

# Terminal 2: Start frontend server (in new terminal)
npm run dev
# Frontend runs on http://localhost:3000
\`\`\`

**Option B: Production mode**
\`\`\`bash
# Build and start frontend
npm run build
npm start
\`\`\`

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## Features Available
✅ User Authentication (Login/Signup)
✅ Merchant Wall (Social Feed)
✅ Store (Product Grid)
✅ Real-time Chat
✅ Seller Dashboard
✅ Admin Panel
✅ Payment Integration (Stripe)
✅ Picked Items (Wishlist)

## Troubleshooting

### Signup Issues
- Make sure backend server is running on port 5000
- Check browser console for error messages
- Verify MongoDB connection in backend logs

### Image Stretching (Fixed)
- Store page now uses responsive grid: 2 cols mobile, 3+ cols desktop

### CORS Issues
- Next.js proxy is configured to forward `/api/*` requests to backend
- Backend CORS is set to allow `http://localhost:3000`

## Database Setup
- MongoDB: Already configured with your connection string
- Redis: Already configured with your Upstash URL
- No manual database setup required - models will create collections automatically
