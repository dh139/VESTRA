import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect } from '../middlewares/auth.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const router = express.Router();

// Helper to generate JWT
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing.');
  }
  return jwt.sign({ id }, secret, {
    expiresIn: '30d'
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists.' });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      const token = generateToken(user._id);
      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/auth/google
 * @desc    Mock Google Authentication (Signup/Signin)
 */
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ success: false, message: 'Google credential token is required.' });
  }
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ success: false, message: 'Invalid token payload.' });
    }
    const { email, name, sub: googleId } = payload;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address not provided by Google account.' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      // Create user without password (federated)
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        role: 'customer'
      });
    } else if (!user.googleId) {
      // Link google account to existing email
      user.googleId = googleId;
      await user.save();
    }

    const token = generateToken(user._id);
    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google verification error:', error);
    return res.status(400).json({ success: false, message: 'Google authentication failed: ' + error.message });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile details
 */
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('wishlist');
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/auth/profile/address
 * @desc    Add or update saved address
 */
router.post('/profile/address', protect, async (req, res) => {
  const { addressId, fullName, phone, addressLine1, addressLine2, landmark, city, state, pincode, country, isDefault } = req.body;
  try {
    const user = await User.findById(req.user._id);
    
    if (isDefault) {
      user.savedAddresses.forEach(addr => addr.isDefault = false);
    }

    if (addressId) {
      // Update address
      const addr = user.savedAddresses.id(addressId);
      if (addr) {
        addr.fullName = fullName;
        addr.phone = phone;
        addr.addressLine1 = addressLine1;
        addr.addressLine2 = addressLine2;
        addr.landmark = landmark;
        addr.city = city;
        addr.state = state;
        addr.pincode = pincode;
        addr.country = country || 'India';
        addr.isDefault = isDefault;
      }
    } else {
      // Add new address
      user.savedAddresses.push({
        fullName,
        phone,
        addressLine1,
        addressLine2,
        landmark,
        city,
        state,
        pincode,
        country: country || 'India',
        isDefault
      });
    }

    await user.save();
    return res.json({ success: true, savedAddresses: user.savedAddresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/auth/profile/address/:id
 * @desc    Delete a saved address
 */
router.delete('/profile/address/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.savedAddresses.pull({ _id: req.params.id });
    await user.save();
    return res.json({ success: true, savedAddresses: user.savedAddresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/auth/wishlist
 * @desc    Toggle item in customer wishlist
 */
router.post('/wishlist', protect, async (req, res) => {
  const { productId } = req.body;
  try {
    const user = await User.findById(req.user._id);
    const index = user.wishlist.indexOf(productId);
    
    if (index > -1) {
      user.wishlist.splice(index, 1); // Remove
    } else {
      user.wishlist.push(productId); // Add
    }
    
    await user.save();
    return res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/auth/notifications
 * @desc    Get notification list for logged in customer
 */
router.get('/notifications', protect, async (req, res) => {
  try {
    const list = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(30);
    return res.json({ success: true, list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/auth/notifications/read
 * @desc    Mark all user notifications as read
 */
router.put('/notifications/read', protect, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
