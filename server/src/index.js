import dotenv from 'dotenv';
dotenv.config();

// Critical environment validation
const REQUIRED_ENV = ['JWT_SECRET', 'GOOGLE_CLIENT_ID', 'RAZORPAY_KEY_ID'];
for (const envVar of REQUIRED_ENV) {
  if (!process.env[envVar]) {
    console.error(`[CRITICAL] Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

// Initialize Database connection
connectDB();

// Listen
app.listen(PORT, () => {
  console.log(`[Vestra Engine] Server listening on port ${PORT} in development mode.`);
});
