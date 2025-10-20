// routes/auth.js
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/?error=auth_failed' 
  }),
  async (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: req.user._id, 
          email: req.user.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
        // console.log("token", token);
      // Set secure cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1 * 24 * 60 * 60 * 1000, // 1 days
        sameSite: 'lax'
      });
      // console.log("Auth success: ");
      // Redirect to profile page
      res.redirect('/?auth=success');
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect('/?error=auth_callback_failed');
    }
  }
);

// Add to your auth route or create a debug route
router.get('/debug/jwt', (req, res) => {
  const token = req.cookies.authToken;
  
  // console.log('JWT Debug:');
  // console.log('Token exists:', !!token);
  // console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  // console.log('JWT_SECRET value:', process.env.JWT_SECRET?.substring(0, 10) + '...');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.json({
        success: true,
        decoded: decoded,
        tokenValid: true
      });
    } catch (error) {
      res.json({
        success: false,
        error: error.message,
        tokenExists: true,
        secretExists: !!process.env.JWT_SECRET
      });
    }
  } else {
    res.json({
      success: false,
      error: 'No token found'
    });
  }
});
// Logout route
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    
    // Clear auth cookie
    res.clearCookie('authToken');
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      hasProfile: !!req.user.profile
    }
  });
});

// Check auth status
router.get('/status', (req, res) => {
  // console.log("status: ", req.cookies);
  const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.json({
      success: false,
      authenticated: false,
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      success: true,
      authenticated: true,
      userId: decoded.userId,
      email: decoded.email
    });
  } catch (error) {
    res.json({
      success: false,
      authenticated: false,
      message: 'Invalid token'
    });
  }
});



function authenticateToken(req, res, next) {
  // console.log('Auth check - cookies:', req.cookies);
  // console.log('Auth check - headers:', req.headers.authorization);
  
  // First, check for session-based auth (from Passport)
  if (req.user) {
    // console.log('User authenticated via session:', req.user.email);
    return next();
  }
  
  // Then check for JWT token in cookies
  const token = req.cookies.authToken;
  
  if (token) {
    try {
      // console.log('Attempting to verify JWT token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Set req.user from JWT payload
      // console.log('User authenticated via JWT:', decoded.email || decoded._id);
      return next();
    } catch (error) {
      console.error('JWT verification failed:', error.message);
      // Continue to check Authorization header below
    }
  }
  
  // Finally, check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const headerToken = authHeader.substring(7);
    try {
      const decoded = jwt.verify(headerToken, process.env.JWT_SECRET);
      req.user = decoded;
      // console.log('User authenticated via Bearer token:', decoded.email || decoded._id);
      return next();
    } catch (error) {
      console.error('Bearer token verification failed:', error.message);
    }
  }
  
  // If no valid authentication found
  // console.log('No authenticated user found');
  return res.status(401).json({
    success: false,
    message: 'Authentication required',
    debug: {
      hasSession: !!req.session,
      hasUser: !!req.user,
      hasCookieToken: !!req.cookies.authToken,
      hasAuthHeader: !!req.headers.authorization,
      sessionId: req.sessionID
    }
  });
}


module.exports = router;
module.exports.authenticateToken = authenticateToken;