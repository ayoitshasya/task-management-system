// server.js - Main entry point for the Express backend
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { startNotificationCron } = require('./services/notificationService');

const app = express();

// Connect to MongoDB first, then start the server
connectDB().then(() => {
  // Enable CORS so the React frontend (running on port 3000) can talk to this server
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));

  // Parse incoming JSON request bodies
  app.use(express.json());

  // Mount all routes
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/reports', reportRoutes);

  // Simple health check route
  app.get('/', (req, res) => {
    res.json({ message: 'Task Management System API is running' });
  });

  // Start the cron job for overdue notifications
  startNotificationCron();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
