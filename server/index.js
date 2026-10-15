const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database
require('./db');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folders (Persistent storage outside server directory)
const fs = require('fs');
const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '../data/uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/checkout', require('./routes/checkout'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/couriers', require('./routes/couriers'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api', require('./routes/payments'));

// Initialize Automated Daily Backups Service (Retains last 7 daily snapshots)
const backupService = require('./services/backupService');
backupService.initAutomaticBackups();

// Serve frontend dist build if present in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API route not found' });
  }
  const indexPath = path.join(distPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('TRENDYTOYZ API Server is running on port ' + PORT);
  }
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 TRENDYTOYZ Server running on http://localhost:${PORT}`);
  console.log(`===================================================`);
});
