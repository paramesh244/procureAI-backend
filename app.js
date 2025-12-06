// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const rfpRoutes = require('./routes/rfp');
const vendorRoutes = require('./routes/vendor');
const proposalRoutes = require('./routes/proposals');
const imapReceiver = require('./services/imapReceiver');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; 

// CORS handling
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});

app.use(express.json());
app.use('/rfp', rfpRoutes);
app.use('/vendor', vendorRoutes);
app.use('/proposals', proposalRoutes);


const server = app.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
  // start any non-blocking background services after we have bound the port
  try {
    if (typeof imapReceiver?.start === 'function') {
      // start it asynchronously and catch errors
      setImmediate(() => {
        imapReceiver.start().catch?.(err => console.error('imapReceiver error:', err));
      });
    }
  } catch (err) {
    console.error('Error starting imapReceiver:', err);
  }
});

// Connect to MongoDB in background; include a short serverSelectionTimeoutMS so it fails fast
const mongoOptions = {
  // adjust options as needed
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_TIMEOUT_MS || '5000', 10), // 5s default
  // useUnifiedTopology: true // not needed in modern mongoose (v6+)
};

mongoose.connect(process.env.DB_URL, mongoOptions)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Optional: decide whether to exit if DB is required for boot
    // process.exit(1);
  });

// graceful shutdown
const shutdown = (signal) => {
  console.log(`Received ${signal}. Closing server...`);
  server.close(() => {
    mongoose.disconnect().catch(() => {});
    process.exit(0);
  });
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
