const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { db } = require('./config/firebase');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Example route to fetch all 'informasi'
app.get('/api/informasi', async (req, res) => {
  try {
    const snapshot = await db.collection('informasi').get();
    const data = [];
    snapshot.forEach(doc => {
      data.push({ id: doc.id, ...doc.data() });
    });
    res.json(data);
  } catch (error) {
    console.error("Error fetching informasi:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
