const express = require('express');
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
app.get('/api/health', async (req, res) => {
  try {
    await require('./config/database').authenticate();
    res.json({ status: 'ok', message: 'VendorBridge API is running', db: 'connected' });
  } catch (error) {
    res.json({ status: 'error', message: 'VendorBridge API is running', db: 'disconnected' });
  }
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

// Database Connection
const { sequelize } = require('./models');

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite connected successfully!');
    
    // Auto-sync the schema (use force: false for safety in prod)
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully!');

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 VendorBridge server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(`❌ Failed:`, err);
    process.exit(1);
  }
};

startServer();
