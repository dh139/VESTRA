import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import pincodeRoutes from './routes/pincodeRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directories serving
app.use('/invoices', express.static(path.join(__dirname, '..', 'public', 'invoices')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// Routes mapping
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/pincodes', pincodeRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/admin', adminRoutes);

// Base health check
app.get('/health', (req, res) => {
  return res.json({ status: 'OK', message: 'Vestra server is running.' });
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error(`[Express Error Handler] ${err.stack}`);
  return res.status(500).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
});

export default app;
