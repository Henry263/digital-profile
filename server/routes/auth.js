// routes/auth.js
const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const CryptoJS = require('crypto-js');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile'); // ✅ Only Profile, no User
const emailService = require('../services/emailService');

const router = express.Router();

// ============== HELPER FUNCTIONS ==============

const validateEmail = (email) => {
  const gmailRegex = /@gmail\.com$/i;
  return gmailRegex.test(email);
};

const passwordValidation = [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&#]/).withMessage('Password must contain at least one special character (@$!%*?&#)')
];

// ============== GOOGLE OAUTH ROUTES ==============

router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    accessType: 'offline'
  })
);

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/?error=auth_failed',
    keepSessionInfo: true 
  }),
  async (req, res) => {
    try {
      // console.log("req", req.user);
      // Generate JWT token
      const token = jwt.sign(
        {
          userId: req.user._id,
          email: req.user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set secure cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax'
      });

      // Redirect to profile page
      res.redirect('/?auth=success');
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect('/?error=auth_callback_failed');
    }
  }
);

// ============== EMAIL/PASSWORD AUTH ROUTES ==============

// 1. SIGNUP with Email/Password
router.post('/signup', [
  
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { email, password, name } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is Gmail
    if (validateEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Gmail accounts must use Google Sign-In',
        useGoogleOAuth: true
      });
    }

    // Check if profile already exists
    const existingProfile = await Profile.findOne({ email: normalizedEmail });

    if (existingProfile) {
      // Profile registered with Google OAuth
      if (existingProfile.authProvider === 'google' || existingProfile.googleId) {
        return res.status(400).json({
          success: false,
          message: 'This email is already registered with Google Sign-In. Please use Google to login.',
          useGoogleOAuth: true
        });
      }

      // Profile registered with email but not verified yet
      if (existingProfile.authProvider === 'email' && !existingProfile.isEmailVerified) {
        console.log('📧 Unverified profile exists, checking verification status...');

        // Check if verification code is still valid
        const isCodeValid = existingProfile.verificationCodeExpires &&
          existingProfile.verificationCodeExpires > Date.now();

        if (isCodeValid) {
          // console.log('✅ Valid verification code exists, redirecting to verification');
          return res.status(200).json({
            success: true,
            message: 'Verification email already sent. Please check your email.',
            redirectToVerification: true,
            email: existingProfile.email,
            codeExpiresIn: Math.floor((existingProfile.verificationCodeExpires - Date.now()) / 1000)
          });
        } else {
          console.log('⏰ Verification code expired, generating new code...');

          const newVerificationCode = existingProfile.generateVerificationCode();
          await existingProfile.save();

          const emailResult = await emailService.sendVerificationCode(
            normalizedEmail,
            newVerificationCode,
            existingProfile.name
          );

          if (emailResult.success) {
            return res.status(200).json({
              success: true,
              message: 'New verification code sent to your email.',
              redirectToVerification: true,
              email: existingProfile.email,
              codeResent: true
            });
          } else {
            console.log('❌ Failed to resend verification, deleting old profile');
            await Profile.findByIdAndDelete(existingProfile._id);
          }
        }
      }

      // Profile already verified
      if (existingProfile.authProvider === 'email' && existingProfile.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists. Please login.',
          redirectToLogin: true
        });
      }
    }

    // Create new profile
    // const bcryptHash = await bcrypt.hash(password, 12);
    // console.log('📝 Creating new profile for:', normalizedEmail);
    // console.log('📝 Creating new password:', password);
    const profile = new Profile({
      email: normalizedEmail,
      name: name.trim(),
      password: password,
      authProvider: 'email',
      isEmailVerified: false,
      isPublic: true
    });
    profile.skipPasswordHash = true;
    // Generate verification code
    const verificationCode = profile.generateVerificationCode();

    // console.log('🔍 Generated code:', verificationCode);
    // console.log('🔍 Profile verificationCode:', profile.verificationCode);

    try {
      profile.userId = profile._id;
      await profile.save();
      // console.log('✅ Profile created successfully');

      // ✅ Set userId to profile's own _id for backward compatibility


      // Verify it was saved
      const savedProfile = await Profile.findById(profile._id);
      // console.log('🔍 Saved profile verificationCode:', savedProfile.verificationCode);
      // console.log('🔍 Saved profile verificationCodeExpires:', savedProfile.verificationCodeExpires);

    } catch (saveError) {
      console.error('❌ Profile save error:', saveError);

      if (saveError.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists. Please try logging in.'
        });
      }

      throw saveError;
    }

    // Send verification email
    console.log('📧 Sending verification email to:', normalizedEmail);
    const emailResult = await emailService.sendVerificationCode(normalizedEmail, verificationCode, name);

    if (!emailResult.success) {
      console.error('❌ Failed to send verification email');
      await Profile.findByIdAndDelete(profile._id);

      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    console.log('✅ Verification email sent successfully');

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email for verification code.',
      redirectToVerification: true,
      userId: profile._id,
      email: profile.email,
      codeExpiresIn: 900
    });

  } catch (error) {
    console.error('💥 Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

// 2. VERIFY EMAIL
router.post('/verify-email', [
  body('email').isEmail(),
  body('code').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const { email, code } = req.body;

    const profile = await Profile.findOne({
      email: email.toLowerCase()
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    if (profile.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    if (!profile.verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please request a new one.',
        expired: true
      });
    }

    if (profile.verificationCodeExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
        expired: true
      });
    }

    const userCode = String(profile.verificationCode).trim();
    const inputCode = String(code).trim();

    // console.log('🔍 Comparing codes:');
    // console.log('   Input:', inputCode);
    // console.log('   Stored:', userCode);

    if (userCode !== inputCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Verify the profile
    profile.isEmailVerified = true;
    profile.verificationCode = undefined;
    profile.verificationCodeExpires = undefined;
    profile.lastLogin = new Date();
    await profile.save();

    console.log('✅ Profile verified successfully');

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: profile._id,
        email: profile.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    req.session.userId = profile._id;
    req.session.email = profile.email;

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.json({
      success: true,
      message: 'Email verified successfully!',
      token,
      user: {
        id: profile._id,
        name: profile.name,
        email: profile.email,
        isEmailVerified: profile.isEmailVerified,
        hasProfile: true
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email'
    });
  }
});

// 3. RESEND VERIFICATION CODE
router.post('/resend-verification', [
  body('email').isEmail()
], async (req, res) => {
  try {
    const { email } = req.body;

    const profile = await Profile.findOne({
      email: email.toLowerCase()
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    if (profile.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    const verificationCode = profile.generateVerificationCode();
    await profile.save();

    const emailResult = await emailService.sendVerificationCode(email, verificationCode, profile.name);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    res.json({
      success: true,
      message: 'Verification code sent to your email'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending verification code'
    });
  }
});

// 4. LOGIN with Email/Password
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    // console.log("====== inside login: ======= ", req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { email, password } = req.body;
    // console.log("password", password);

  
    // console.log("plainPassword", plainPassword);
    if (validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Gmail accounts must use Google Sign-In',
        useGoogleOAuth: true
      });
    }

    const profile = await Profile.findOne({
      email: email.toLowerCase()
    }).select('+password');
    // console.log("profile from ongo: ", profile.password);


    if (!profile) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (profile.authProvider !== 'email') {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In',
        useGoogleOAuth: true
      });
    }

    if (!profile.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
        emailNotVerified: true,
        email: profile.email
      });
    }

    // const isPasswordValid = await profile.comparePassword(password);
    // if (!isPasswordValid) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Invalid email or password'
    //   });
    // }

    const isPasswordValid = (password === profile.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    profile.lastLogin = new Date();
    await profile.save();

    req.session.userId = profile._id;
    req.session.email = profile.email;

    const token = jwt.sign(
      {
        userId: profile._id,
        email: profile.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: profile._id,
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        hasProfile: true
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error during login'
    });
  }
});

// 5. FORGOT PASSWORD
router.post('/forgot-password', [
  body('email').isEmail()
], async (req, res) => {
  try {
    const { email } = req.body;

    const profile = await Profile.findOne({
      email: email.toLowerCase(),
      authProvider: 'email'
    });

    if (!profile) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, we sent a password reset link'
      });
    }

    const resetToken = profile.generateResetToken();
    await profile.save();

    await emailService.sendPasswordResetEmail(email, resetToken, profile.name);

    res.json({
      success: true,
      message: 'Password reset link sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing request'
    });
  }
});


// In server/routes/auth.js

// 6. RESET PASSWORD
router.post('/reset-password', [
  body('token').notEmpty()
], async (req, res) => {
  try {
    const { token, password } = req.body;

    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log("Hased token: ", hashedToken);
    const profile = await Profile.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    // const bcryptHash = await bcrypt.hash(password, 12);
    profile.password = password;
    profile.resetPasswordToken = undefined;
    profile.resetPasswordExpires = undefined;
    await profile.save();

    res.json({
      success: true,
      message: 'Password reset successful! You can now login with your new password'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
});

// ============== LOGOUT ==============

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }

    res.clearCookie('authToken');
    // Clear authToken cookie
    res.clearCookie('authToken', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.qrmypro.com' : undefined
    });

    // IMPORTANT: Clear the session cookie (qrmypro.sid)
    res.clearCookie('qrmypro.sid', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.qrmypro.com' : undefined
    });
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

// ============== GET CURRENT USER ==============

function authenticateToken(req, res, next) {
  // Check for session-based auth (from Passport)
  if (req.user) {
    return next();
  }

  // Check for JWT token in cookies
  const token = req.cookies.authToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (error) {
      console.error('JWT verification failed:', error.message);
    }
  }

  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const headerToken = authHeader.substring(7);
    try {
      const decoded = jwt.verify(headerToken, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (error) {
      console.error('Bearer token verification failed:', error.message);
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
}

// Add this NEW endpoint in auth.js - UNIFIED USER + PROFILE
router.get('/user-profile', authenticateToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ email: req.user.email });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
        authenticated: true,
        user: {
          email: req.user.email,
          hasProfile: false
        }
      });
    }

    // Check if photo exists
    const hasPhoto = profile.hasProfilePhoto();

    // Return unified response with both user and profile data
    res.json({
      success: true,
      authenticated: true,
      user: {
        id: profile._id,
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        hasProfile: true
      },
      profile: {
        _id: profile._id,
        cardId: profile.cardId,
        name: profile.name,
        title: profile.title,
        organization: profile.organization,
        phone: profile.phone,
        mobile: profile.mobile,
        email: profile.email,
        website: profile.website,
        address: profile.address,
        notes: profile.notes,
        showPhoneNumber: profile.showPhoneNumber,
        country: profile.country || { name: '', code: '' },
        state: profile.state || { name: '', id: '', code: '' },
        city: profile.city || { name: '', id: '' },
        socialMedia: profile.socialMedia,
        theme: profile.theme,
        isPublic: profile.isPublic,
        views: profile.views,
        lastViewed: profile.lastViewed,
        qrCodes: profile.qrCodes || [],
        uploadedQR: profile.uploadedQR,
        qrSettings: profile.qrSettings,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        slug: profile.slug,
        hasProfilePhoto: hasPhoto,
        initials: profile.getInitials ? profile.getInitials() : getInitials(profile.name)
      },
      qrCodes: profile.qrCodes || [],
      primaryQR: profile.qrCodes ? profile.qrCodes.find(qr => qr.type === 'standard') : null,
      standaloneUrl: profile.generateStandaloneUrl(),
      profileshortUrl: await profile.getOrCreateShortUrl()
    });

  } catch (error) {
    console.error('Get user-profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user and profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function
function getInitials(name) {
  if (!name) return 'U';
  const names = name.trim().split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const profile = await Profile.findById(req.user.userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: profile._id,
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        hasProfile: true
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

router.get('/status', (req, res) => {
  const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];
// console.log("Token: ", token);
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

// Debug route (remove in production)
router.get('/debug/jwt', (req, res) => {
  const token = req.cookies.authToken;

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

module.exports = router;
module.exports.authenticateToken = authenticateToken;