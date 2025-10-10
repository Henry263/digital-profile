// middleware/qrMiddleware.js
const QRService = require('../services/qrService');
const Profile = require('../models/Profile');
const Analytics = require('../models/Analytics');

class QRMiddleware {
  // Middleware to ensure QR codes exist for profile
  static async ensureQRCodes(req, res, next) {
    try {
      if (req.profile && (!req.profile.qrCodes || req.profile.qrCodes.length === 0)) {
        console.log(`🔲 Generating missing QR codes for: ${req.profile.name}`);
        
        const newQRCodes = await QRService.generateMultipleFormats(req.profile);
        req.profile.qrCodes = newQRCodes;
        req.profile.primaryQR = newQRCodes.find(qr => qr.type === 'standard')?._id;
        await req.profile.save();
        
        console.log(`✅ Generated ${newQRCodes.length} QR codes`);
      }
      next();
    } catch (error) {
      console.error('QR ensure middleware error:', error);
      next(); // Continue even if QR generation fails
    }
  }

  // Middleware to track QR code usage
  static trackQRUsage(source = 'unknown') {
    return async (req, res, next) => {
      try {
        if (req.profile) {
          // Track QR code usage
          await Analytics.create({
            profileId: req.profile._id,
            event: 'qr_scan',
            eventData: {
              source: source,
              cardId: req.profile.cardId,
              userAgent: req.get('User-Agent'),
              referer: req.get('Referer')
            },
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            referrer: req.get('Referer')
          });
        }
        next();
      } catch (error) {
        console.error('QR tracking middleware error:', error);
        next(); // Continue even if tracking fails
      }
    };
  }

  // Middleware to validate QR generation parameters
  static validateQRParams(req, res, next) {
    const { size, darkColor, lightColor } = req.body;
    
    const errors = [];

    // Validate size
    if (size && (typeof size !== 'number' || size < 100 || size > 2000)) {
      errors.push('Size must be a number between 100 and 2000');
    }

    // Validate colors (hex format)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    
    if (darkColor && !hexColorRegex.test(darkColor)) {
      errors.push('Dark color must be a valid hex color');
    }
    
    if (lightColor && !hexColorRegex.test(lightColor)) {
      errors.push('Light color must be a valid hex color');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors
      });
    }

    next();
  }

  // Middleware to rate limit QR generation
  static rateLimitQRGeneration(maxGenerationsPerHour = 10) {
    const userGenerations = new Map();

    return async (req, res, next) => {
      try {
        const userId = req.user._id.toString();
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        // Clean up old entries
        if (userGenerations.has(userId)) {
          const userTimes = userGenerations.get(userId).filter(time => now - time < oneHour);
          userGenerations.set(userId, userTimes);
        }

        // Check rate limit
        const userTimes = userGenerations.get(userId) || [];
        if (userTimes.length >= maxGenerationsPerHour) {
          return res.status(429).json({
            success: false,
            message: `Rate limit exceeded. Maximum ${maxGenerationsPerHour} QR generations per hour.`,
            retryAfter: Math.ceil((oneHour - (now - userTimes[0])) / 1000 / 60) // minutes
          });
        }

        // Add current generation
        userTimes.push(now);
        userGenerations.set(userId, userTimes);

        next();
      } catch (error) {
        console.error('QR rate limit middleware error:', error);
        next();
      }
    };
  }
}

module.exports = QRMiddleware;
