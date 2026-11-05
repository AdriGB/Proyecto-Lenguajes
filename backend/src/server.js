const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const servicesRouter = require('./routes/services');
const contactRouter = require('./routes/contact');
const operatorRouter = require('./routes/operator');
const usersRouter = require('./routes/users');
const metricsRouter = require('./routes/metrics');

const app = express();

// Security and CORS middleware - allows localhost and local network / mobile devices
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route mounting
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/contact', contactRouter);
app.use('/api/operator', operatorRouter);
app.use('/api/users', usersRouter);
app.use('/api/metrics', metricsRouter);

// 404 handler for undefined API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Serve frontend production build when available
const distPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message
  });
});

// Start listening if run directly
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Backend server running on http://localhost:${config.port} [${config.nodeEnv}]`);
  });
}

module.exports = app;
