'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const tunnelController = require('../controllers/tunnelController');

// ── Instance-auth middleware (alternative to cloud JWT) ────────────────────
// Docker-instance containers sign a short-lived JWT with their own JWT_SECRET
// (= 'logicai-secret-key-change-in-production') containing { email, instanceId }.
// The cloud server verifies it, looks up the user by email, and populates req.user.
// This allows tunnel management without requiring the cloud JWT in the frontend.
const INSTANCE_JWT_SECRET = process.env.INSTANCE_JWT_SECRET || 'logicai-secret-key-change-in-production';

async function instanceAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  const token = authHeader.substring(7);

  let decoded;
  try {
    decoded = jwt.verify(token, INSTANCE_JWT_SECRET);
  } catch {
    return next(); // invalid — fall through to cloud authMiddleware
  }

  // Only treat as instance-signed if it has both instanceId and email
  if (!decoded.email || !decoded.instanceId) return next();

  // Check instanceId matches the route parameter (prevents one instance calling on behalf of another)
  const uuidInRoute = req.params.uuid;
  if (uuidInRoute && decoded.instanceId !== uuidInRoute) {
    return res.status(403).json({ success: false, message: 'instanceId mismatch' });
  }

  // Look up cloud user by email
  try {
    const user = await User.findByEmail(decoded.email);
    if (!user) return next(); // unknown email → fall through to cloud auth
    req.user = user;
  } catch {
    return next();
  }
  next();
}

router.use(instanceAuthMiddleware);
router.use(authMiddleware);

// Get tunnel info for a local instance
router.get('/:uuid', tunnelController.getTunnel);

// Create (or replace) a tunnel for a local instance
router.post('/:uuid', tunnelController.createTunnel);

// Delete tunnel for a local instance
router.delete('/:uuid', tunnelController.deleteTunnel);

module.exports = router;
