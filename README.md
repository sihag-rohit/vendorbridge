# VendorBridge ERP

VendorBridge is an intelligent procurement ERP platform built to connect vendors, automate RFQs, streamline approvals, and manage purchase orders/invoices all in one place.

## Features
- **Role-Based Access Control**: Admin, Procurement Officer, Vendor, and Manager roles with distinct dashboards.
- **RFQ Automation**: Create, publish, and track Requests for Quotation.
- **Smart Quotation Comparison**: Automatically compare vendor quotations side-by-side.
- **Purchase Orders & Invoices**: Generate and track POs and invoices instantly upon quotation approval.
- **Real-Time Notifications**: Instant notifications for all critical procurement activities using Socket.io.
- **Activity Logging**: Full audit trail of all system actions.

## Technology Stack
- **Frontend**: React, Vite, TailwindCSS, Framer Motion, Lucide React
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io
- **Security**: JWT Authentication, bcrypt password hashing

## Prerequisites
- Node.js (v18+ recommended)
- MongoDB Atlas account (or local MongoDB instance)

## Getting Started

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd vendorbridge-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `vendorbridge-backend` directory with your database credentials:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```
4. Run the database seeder to initialize the admin, officer, and vendor accounts:
   ```bash
   npm run seed
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd vendorbridge-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Demo Credentials
Once both servers are running, open your browser to `http://localhost:5173`. You can log in using any of the following accounts created by the seeder script:

**Admin/Officer Account:**
- **Email**: `admin@vendorbridge.com` OR `officer@vendorbridge.com`
- **Password**: `password123`

**Vendor Account:**
- **Email**: `vendor1@vendorbridge.com`
- **Password**: `password123`

## Running Locally for Hackathon Evaluation
Make sure both the frontend (Vite) and backend (Node/Express) servers are running concurrently in two separate terminal windows.
