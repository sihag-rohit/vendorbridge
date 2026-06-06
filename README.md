# VendorBridge ERP

Hey everyone! Welcome to VendorBridge. We built this for the Odoo Hackathon to solve a real headache in the procurement world: keeping vendors, purchasing officers, and managers all on the same page. 

It's essentially a streamlined ERP platform that handles everything from sending out Requests for Quotation (RFQs) to tracking purchase orders and managing invoices.

## What it does
- **Smart RFQs**: Officers can create RFQs, and assigned vendors get notified instantly so they can submit their bids.
- **Quote Comparisons**: We built a feature that lets you compare vendor quotations side-by-side so you can make the best choice. 
- **PO & Invoice Generation**: Once a quote is approved, you can instantly spin up a Purchase Order and later turn it into a trackable Invoice.
- **Different Roles**: The dashboard completely adapts depending on whether you log in as an Admin, Officer, Vendor, or Manager.

## Tech Stack
We kept the stack modern and fast:
- **Frontend**: React + Vite (styled with TailwindCSS & Framer Motion for that smooth feel).
- **Backend**: Node.js & Express.
- **Database**: SQLite (using Sequelize). We went with SQLite so it's super easy for the judges to run locally without needing to configure external database connections!

---

## How to run it locally

You'll need Node.js installed. We've set this up so it runs right out of the box.

### 1. Fire up the backend
Open your terminal and jump into the backend folder:
```bash
cd vendorbridge-backend
```
Install the packages:
```bash
npm install
```
Seed the database with our demo data (this is important, it creates the test accounts):
```bash
npm run seed
```
Start the server!
```bash
npm run dev
```

### 2. Fire up the frontend
Open a second terminal window and jump into the frontend folder:
```bash
cd vendorbridge-frontend
```
Install the packages:
```bash
npm install
```
Start the Vite dev server:
```bash
npm run dev
```

---

## Demo Accounts

Go to `http://localhost:5173` in your browser. We already created some test accounts during the database seed so you can jump right in without needing to register:

**Officer / Admin Account:**
- **Email:** `officer@vendorbridge.com` (or `admin@vendorbridge.com`)
- **Password:** `password123`

**Vendor Account:**
- **Email:** `vendor1@vendorbridge.com`
- **Password:** `password123`

Feel free to play around with it!
