const path = require('path');
const fs = require('fs');

const envPathFromBackend = path.resolve(__dirname, '../.env');
const envPathLocal = path.resolve(__dirname, '.env');

require('dotenv').config({
  path: fs.existsSync(envPathFromBackend) ? envPathFromBackend : envPathLocal,
});
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
//require('dotenv').config();

const spotRoutes = require('./routes/spotRoutes');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mockMode: mongoose.connection.readyState !== 1,
  });
});

app.use('/api/spots', spotRoutes);

async function startServer() {
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB connected');
    } catch (error) {
      console.warn('MongoDB unavailable, continuing with mock parking data');
    }
  } else {
    console.warn('MONGO_URI is missing, continuing with mock parking data');
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
