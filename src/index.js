require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { initializeB2 } = require('./config/backblaze');
const authRoutes = require('./routes/auth');
const imageRoutes = require('./routes/images');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/api/images', imageRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.get('/success', (req, res) => {
  res.send("✅ Your email has been confirmed. You can now log in.");
});

// Initialize Backblaze B2 and start server
const startServer = async () => {
  try {
    await initializeB2();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize Backblaze B2:', error);
    process.exit(1);
  }
};

startServer();