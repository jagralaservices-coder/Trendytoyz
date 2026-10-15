const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

// Customer Register
router.post('/register', (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone ? phone.trim() : '';

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Yeh email address pehle se registered hai. Kripya login karein.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (name, email, phone, password, role, status)
      VALUES (?, ?, ?, ?, 'customer', 'active')
    `).run(cleanName, cleanEmail, cleanPhone, hashedPassword);

    const user = { id: result.lastInsertRowid, name: cleanName, email: cleanEmail, role: 'customer' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Server error during registration.' });
  }
});

// Customer & Admin Login
router.post('/login', (req, res) => {
  try {
    const { email, password, loginType } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Email ya password galat hai.' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, error: 'Your account has been suspended. Please contact support.' });
    }

    // Check role restriction if loginType is admin
    if (loginType === 'admin' && user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. You do not have admin permissions.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Email ya password galat hai.' });
    }

    const userData = { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token, user: userData });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error during login.' });
  }
});

// Reset / Forgot Password
router.post('/reset-password', (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email aur naya password daalna zaroori hai.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password kam se kam 6 characters ka hona chahiye.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (!user) {
      return res.status(400).json({ success: false, error: 'Is email address se koi account nahi mila. Kripya pehle Sign Up / Register karein.' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);

    const userData = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, message: 'Password safaltapoorvak badal gaya hai.', token, user: userData });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, error: 'Server error updating password.' });
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Session expired or user not found. Please sign in again.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error fetching profile.' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, phone } = req.body;
    db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(name, phone, req.user.id);
    const updatedUser = db.prepare('SELECT id, name, email, phone, role FROM users WHERE id = ?').get(req.user.id);
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error updating profile.' });
  }
});

// Helper to decode base64 JWT payload (for Google & Apple identity tokens)
function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(payloadBase64, 'base64').toString('utf8');
      return JSON.parse(jsonPayload);
    }
  } catch (e) {
    return null;
  }
  return null;
}

// Google Sign-In
router.post('/google', (req, res) => {
  try {
    const { credential, email: directEmail, name: directName, avatar: directAvatar, googleId: directGoogleId } = req.body;

    let email = directEmail;
    let name = directName;
    let avatar = directAvatar || '';
    let googleId = directGoogleId;

    if (credential) {
      const payload = decodeJwtPayload(credential);
      if (payload && payload.email) {
        email = payload.email;
        name = payload.name || name || email.split('@')[0];
        avatar = payload.picture || avatar;
        googleId = payload.sub || googleId;
      }
    }

    if (!email) {
      return res.status(400).json({ success: false, error: 'Google email is required.' });
    }

    email = email.toLowerCase().trim();
    let user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ? OR (google_id IS NOT NULL AND google_id = ?)').get(email, googleId || '');

    if (user) {
      if (user.status === 'blocked') {
        return res.status(403).json({ success: false, error: 'Your account is suspended. Please contact support.' });
      }
      // Update google_id and avatar if missing
      db.prepare(`
        UPDATE users SET 
          google_id = COALESCE(google_id, ?),
          avatar = CASE WHEN avatar = '' OR avatar IS NULL THEN ? ELSE avatar END
        WHERE id = ?
      `).run(googleId || '', avatar || '', user.id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    } else {
      // Register new user with random hashed password
      const tempPass = bcrypt.hashSync(`g_${Math.random()}_${Date.now()}`, 10);
      const result = db.prepare(`
        INSERT INTO users (name, email, phone, password, role, status, google_id, avatar)
        VALUES (?, ?, '', ?, 'customer', 'active', ?, ?)
      `).run(name || email.split('@')[0], email, tempPass, googleId || '', avatar || '');

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }

    const userData = { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar };
    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token, user: userData });
  } catch (err) {
    console.error('Google Auth error:', err);
    res.status(500).json({ success: false, error: 'Google authentication failed.' });
  }
});

// Apple Sign-In (for iPhone / iOS / Mac users)
router.post('/apple', (req, res) => {
  try {
    const { identityToken, email: directEmail, name: directName, user: appleUserId } = req.body;

    let email = directEmail;
    let name = directName;
    let appleId = appleUserId;

    if (identityToken) {
      const payload = decodeJwtPayload(identityToken);
      if (payload) {
        if (payload.email) email = payload.email;
        if (payload.sub) appleId = payload.sub;
      }
    }

    if (!appleId && !email) {
      return res.status(400).json({ success: false, error: 'Apple identifier or email is required.' });
    }

    email = email ? email.toLowerCase().trim() : `apple_${appleId}@privaterelay.appleid.com`;
    let user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ? OR (apple_id IS NOT NULL AND apple_id = ?)').get(email, appleId || '');

    if (user) {
      if (user.status === 'blocked') {
        return res.status(403).json({ success: false, error: 'Your account is suspended. Please contact support.' });
      }
      db.prepare(`UPDATE users SET apple_id = COALESCE(apple_id, ?) WHERE id = ?`).run(appleId || '', user.id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    } else {
      const tempPass = bcrypt.hashSync(`apple_${Math.random()}_${Date.now()}`, 10);
      const result = db.prepare(`
        INSERT INTO users (name, email, phone, password, role, status, apple_id)
        VALUES (?, ?, '', ?, 'customer', 'active', ?)
      `).run(name || 'Apple User', email, tempPass, appleId || '');

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }

    const userData = { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token, user: userData });
  } catch (err) {
    console.error('Apple Auth error:', err);
    res.status(500).json({ success: false, error: 'Apple authentication failed.' });
  }
});

module.exports = router;
