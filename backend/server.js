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

// Cloudflare Turnstile Verification Route
app.post('/api/verify-turnstile', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: 'Token Turnstile tidak disertakan.' });
  }

  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ success: false, error: 'CLOUDFLARE_TURNSTILE_SECRET_KEY belum dikonfigurasi di server.' });
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (req.ip) {
      formData.append('remoteip', req.ip);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return res.status(500).json({ success: false, error: 'Gagal memverifikasi Turnstile.' });
  }
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
