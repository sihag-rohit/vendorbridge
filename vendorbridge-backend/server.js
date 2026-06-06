const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/rfqs', require('./routes/rfqs'));
app.use('/api/quotations', require('./routes/quotations'));
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/approvals', require('./routes/approvals'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/activity-logs', require('./routes/activityLogs'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'VendorBridge API is running', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Socket.io connection handling
const connectedUsers = new Map();
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    connectedUsers.set(userId, socket.id);
  });
  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) { connectedUsers.delete(userId); break; }
    }
  });
});

// MongoDB Connection — try primary URI, fallback to alt
const connectDB = async () => {
  const uris = [
    process.env.MONGODB_URI,
    process.env.MONGODB_URI_ALT
  ].filter(Boolean);

  for (const uri of uris) {
    try {
      const masked = uri.replace(/:([^@]+)@/, ':****@');
      console.log(`Trying: ${masked}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000
      });
      console.log('✅ MongoDB connected successfully!');
      return true;
    } catch (err) {
      console.error(`❌ Failed: ${err.message}`);
    }
  }
  console.error('❌ All MongoDB connection attempts failed.');
  console.log('⚠️  Server will run without database. Please check your MongoDB Atlas credentials and IP whitelist.');
  return false;
};

const startServer = async () => {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 VendorBridge server running on port ${PORT}`);
  });
};

startServer();
