// routes/profile.js (Updated with QR Generation Logic)
const express = require('express');
const multer = require('multer');
const heicConvert = require('heic-convert');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken } = require('./auth');



const Profile = require('../models/Profile');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const QRService = require('../services/qrService');

const sharedfunctions = require('../services/sharedfunctions')
let envVariables = sharedfunctions.readenvironmentconfig();



const router = express.Router();

const { toObjectId } = require('../utils/dbHelpers');

// function toObjectIdm(id) {
//   const mongoose = require('mongoose');
//   return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
// }

// Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: async (req, file, cb) => {
//     console.log("req.user: ", req.user);
//     const uploadDir = path.join(__dirname, '../uploads/profilephotos', req.user.userId.toString());
//     try {
//       await fs.mkdir(uploadDir, { recursive: true });
//       cb(null, uploadDir);
//     } catch (error) {
//       cb(error);
//     }
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
//     if (allowedMimes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type. Only images are allowed.'));
//     }
//   }
// });

// Simple memory storage configuration
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Increase to 10MB for HEIC files (they're larger)
  },
  fileFilter: (req, file, cb) => {
    // UPDATED: Accept standard images + HEIC/HEIF
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',      // iPhone HEIC
      'image/heif',      // Alternative HEIC mime type
      'application/octet-stream' // Sometimes HEIC comes as this
    ];

    // Check by MIME type
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } 
    // Also check by extension (fallback for HEIC)
    else if (file.originalname.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/)) {
      cb(null, true);
    } 
    else {
      cb(new Error('Only image files are allowed (JPG, PNG, GIF, HEIC)'), false);
    }
  }
});

// Debug route - add this temporarily
router.get('/debug', authenticateToken, async (req, res) => {
  try {
    // console.log('Debug: User from token:', req.user);

    res.json({
      success: true,
      debug: {
        userId: req.user._id,
        userEmail: req.user.email,
        userName: req.user.name,
        timestamp: new Date().toISOString(),
        mongooseConnection: mongoose.connection.readyState, // 1 = connected
        envVars: {
          baseUrl: envVariables.BASE_URL,
          nodeEnv: process.env.NODE_ENV
        }
      }
    });
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

function getInitials(name) {
  if (!name) return 'U';
  const names = name.trim().split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
// GET Profile - Read QR codes from DB, generate only if missing
router.get('/', authenticateToken, async (req, res) => {
  try {
    // console.log(`📋 Getting profile for user: ${req.user.email}`);

    const userId = toObjectId(req.user.userId || req.user._id);
    let profile = await Profile.findOne({ userId });

    if (!profile) {
      console.log('❌ No profile found for user');
      return res.json({
        success: true,
        profile: null,
        message: 'No profile found'
      });
    }

    // console.log(`✅ Found profile: ${profile.name} (cardId: ${profile.cardId})`);

    // Check if QR codes exist in database
    let qrCodesGenerated = false;
    if (!profile.qrCodes || profile.qrCodes.length === 0) {
      console.log(`🔲 No QR codes found in DB, generating for: ${profile.name}`);

      try {
        // Generate QR codes and save to database
        const newQRCodes = await QRService.generateMultipleFormats(profile);

        if (newQRCodes && newQRCodes.length > 0) {
          profile.qrCodes = newQRCodes;

          // Find standard QR code for primary
          const standardQR = newQRCodes.find(qr => qr.type === 'standard');
          if (standardQR) {
            profile.primaryQR = standardQR._id;
          }

          // Save updated profile with QR codes to DB
          await profile.save();
          qrCodesGenerated = true;
          // console.log(`✅ Generated and saved ${newQRCodes.length} QR codes to DB`);
        }
      } catch (qrError) {
        console.error('⚠️ QR generation failed during GET, but continuing:', qrError.message);
      }
    } else {
      // console.log(`ℹ️ Found ${profile.qrCodes.length} existing QR codes in DB`);
    }
    // console.log("Before call: 1 step", await profile.getOrCreateShortUrl())

    // Check if photo exists
    const hasPhoto = profile.hasProfilePhoto();

    // console.log('📷 Photo check:', {
    //   hasPhoto,
    //   dataExists: !!(profile.profilePhoto && profile.profilePhoto.data),
    //   dataLength: profile.profilePhoto?.data?.length || 0
    // });

    // Prepare response data
    const responseData = {
      success: true,
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
      profileshortUrl: await profile.getOrCreateShortUrl(),
      qrGenerated: qrCodesGenerated
    };

    res.json(responseData);

  } catch (error) {
    console.error('💥 Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

// POST Profile - Always generate and save QR codes during profile creation/update
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name, title, organization, phone, mobile, email, website, showPhoneNumber,
      address, notes, socialMedia, theme, isPublic, qrSettings, country, state, city
    } = req.body;

    // console.log(`💾 Saving profile for user: ${JSON.stringify(req.user)}`, { name, title, organization });

    const userId = toObjectId(req.user.userId || req.user._id);
    // console.log("userId: ", userId);
    let profile = await Profile.findOne({ userId });
    let isNewProfile = false;
    let shouldRegenerateQR = false;

    if (profile) {
      // console.log(`📝 Updating existing profile: ${profile.name}`);

      // Check if critical info changed (affects QR code)
      const criticalFieldsChanged = (
        profile.name !== name ||
        profile.email !== email ||
        profile.website !== website
      );

      if (criticalFieldsChanged) {
        shouldRegenerateQR = true;
        // console.log(`🔄 Critical fields changed, will regenerate QR codes`);
      }

      // Update existing profile
      // profile.name = name || profile.name;
      // profile.title = title || profile.title;
      // profile.organization = organization || profile.organization;
      // profile.phone = phone || profile.phone;
      // profile.mobile = mobile || profile.mobile;
      // profile.email = email || profile.email;
      // profile.website = website || profile.website;
      // profile.address = address || profile.address;
      // profile.notes = notes || profile.notes;
      // profile.theme = theme || profile.theme;
      // profile.isPublic = isPublic !== undefined ? isPublic : profile.isPublic;
      // profile.showPhoneNumber = showPhoneNumber !== undefined ? showPhoneNumber : profile.showPhoneNumber;  // Add this

      profile.name = name || profile.name;
      profile.title = title !== undefined ? title : profile.title;
      profile.organization = organization !== undefined ? organization : profile.organization;
      profile.phone = phone !== undefined ? phone : profile.phone;
      profile.mobile = mobile !== undefined ? mobile : profile.mobile;
      profile.email = email || profile.email;
      profile.website = website !== undefined ? website : profile.website;
      profile.address = address !== undefined ? address : profile.address;
      profile.notes = notes !== undefined ? notes : profile.notes;
      profile.theme = theme || profile.theme;
      profile.isPublic = isPublic !== undefined ? isPublic : profile.isPublic;
      profile.showPhoneNumber = showPhoneNumber !== undefined ? showPhoneNumber : profile.showPhoneNumber;
      // Update location fields
      if (country) {
        profile.country = {
          name: country.name || '',
          code: country.code || ''
        };
      }

      if (state) {
        profile.state = {
          name: state.name || '',
          id: state.id || '',
          code: state.code || ''
        };
      }

      if (city) {
        profile.city = {
          name: city.name || '',
          id: city.id || ''
        };
      }
      if (socialMedia) {
        profile.socialMedia = { ...profile.socialMedia.toObject(), ...socialMedia };
      }

      if (qrSettings) {
        profile.qrSettings = { ...profile.qrSettings.toObject(), ...qrSettings };
      }
    } else {
      // console.log(`➕ Creating new profile for: ${name}`);
      isNewProfile = true;
      shouldRegenerateQR = true; // Always generate QR for new profiles

      profile = new Profile({
        userId: userId,
        name: name || req.user.name,
        email: email || req.user.email,
        title: title || '',
        organization: organization || '',
        phone: phone || '',
        mobile: mobile || '',
        website: website || '',
        address: address || '',
        notes: notes || '',
        showPhoneNumber: showPhoneNumber !== undefined ? showPhoneNumber : true,  // Add this
        // Location fields
        country: country ? {
          name: country.name || '',
          code: country.code || ''
        } : { name: '', code: '' },
        state: state ? {
          name: state.name || '',
          id: state.id || '',
          code: state.code || ''
        } : { name: '', id: '', code: '' },
        city: city ? {
          name: city.name || '',
          id: city.id || ''
        } : { name: '', id: '' },
        socialMedia: socialMedia || {},
        theme: theme || 'default',
        isPublic: isPublic !== undefined ? isPublic : true,
        qrSettings: qrSettings || { autoRegenerate: true }
      });
    }

    // Save profile first to ensure cardId is generated
    await profile.save();
    // console.log(`✅ Profile saved with cardId: ${profile.cardId}`);

    // Generate QR codes if needed
    let qrGenerated = false;
    let qrCount = 0;

    if (shouldRegenerateQR || !profile.qrCodes || profile.qrCodes.length === 0) {
      // console.log(`🔲 Generating QR codes for: ${profile.name}`);

      try {
        // Clear existing QR codes if regenerating
        if (shouldRegenerateQR && profile.qrCodes) {
          profile.qrCodes = [];
        }

        // Generate new QR codes
        const newQRCodes = await QRService.generateMultipleFormats(profile);

        if (newQRCodes && newQRCodes.length > 0) {
          profile.qrCodes = newQRCodes;

          // Set primary QR code
          const standardQR = newQRCodes.find(qr => qr.type === 'standard');
          if (standardQR) {
            profile.primaryQR = standardQR._id;
          }

          // Save profile with new QR codes to database
          await profile.save();

          qrGenerated = true;
          qrCount = newQRCodes.length;
          // console.log(`✅ Generated and saved ${qrCount} QR codes to database`);
        }
      } catch (qrError) {
        console.error('⚠️ QR generation failed during POST:', qrError.message);
        // Don't fail the whole request if QR generation fails
      }
    } else {
      // console.log(`ℹ️ Profile already has ${profile.qrCodes.length} QR codes, skipping generation`);
      qrCount = profile.qrCodes.length;
    }

    // Update user reference
    await User.findByIdAndUpdate(req.user._id, { profile: profile._id });

    // Find primary QR
    const primaryQR = profile.qrCodes ? profile.qrCodes.find(qr => qr.type === 'standard') : null;
    const baseURL = envVariables.BASE_URL;
    // const standaloneUrl = `${process.env.BASE_URL}/card/${profile.cardId}`;
    const standaloneUrl = `${baseURL}/card/${profile.cardId}`;

    // Prepare response
    const responseData = {
      success: true,
      message: isNewProfile ? 'Profile created successfully' : 'Profile updated successfully',
      profile: {
        _id: profile._id,
        cardId: profile.cardId,
        slug: profile.slug,
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
        country: profile.country,
        state: profile.state,
        city: profile.city,
        socialMedia: profile.socialMedia,
        theme: profile.theme,
        isPublic: profile.isPublic,
        views: profile.views,
        qrCodes: profile.qrCodes || [],
        uploadedQR: profile.uploadedQR,
        qrSettings: profile.qrSettings,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      },
      qrCodes: profile.qrCodes || [],
      primaryQR: primaryQR,
      standaloneUrl: standaloneUrl,
      cardId: profile.cardId,
      isNew: isNewProfile,
      qrGenerated: qrGenerated,
      qrRegenerated: shouldRegenerateQR && qrGenerated,
      qrCount: qrCount
    };

    // console.log(`🎉 Profile ${isNewProfile ? 'creation' : 'update'} complete for: ${profile.name}`);
    res.json(responseData);

  } catch (error) {
    console.error('💥 Save profile error:', error);

    res.status(500).json({
      success: false,
      message: 'Error saving profile',
      error: error.message,
      details: {
        userId: req.user?._id,
        userEmail: req.user?.email,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * Routes for profile photo
 */

 // Upload profile photo
router.post('/upload-profile-photo', authenticateToken, upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // console.log('📸 File received:', {
    //   size: req.file.size,
    //   mimetype: req.file.mimetype,
    //   bufferLength: req.file.buffer.length // NOW THIS EXISTS!
    // });

    const userId = toObjectId(req.user.userId || req.user._id);
    const profile = await Profile.findOne({ userId });
    // console.log("Profile: ", profile);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    let imageBuffer = req.file.buffer;
    let contentType = req.file.mimetype;
    let fileSize = req.file.size;

    // ============================================
    // HEIC CONVERSION LOGIC
    // ============================================
    const isHEIC = 
      req.file.mimetype === 'image/heic' || 
      req.file.mimetype === 'image/heif' ||
      req.file.originalname.toLowerCase().endsWith('.heic') ||
      req.file.originalname.toLowerCase().endsWith('.heif');

    if (isHEIC) {
      // console.log('🔄 Converting HEIC to JPEG...');
      
      try {
        // Convert HEIC to JPEG
        const outputBuffer = await heicConvert({
          buffer: req.file.buffer,
          format: 'JPEG',      // Output format
          quality: 0.9         // Quality (0-1), 0.9 = 90%
        });

        imageBuffer = outputBuffer;
        contentType = 'image/jpeg';
        fileSize = outputBuffer.length;

        // console.log('✅ HEIC converted:', {
        //   originalSize: req.file.size,
        //   convertedSize: outputBuffer.length,
        //   newType: 'image/jpeg'
        // });
      } catch (conversionError) {
        console.error('❌ HEIC conversion failed:', conversionError);
        return res.status(400).json({ 
          success: false, 
          message: 'Failed to convert HEIC file. Please try a different format.' 
        });
      }
    }

    // Save to MongoDB (now as JPEG if it was HEIC)
    profile.profilePhoto = {
      data: imageBuffer,
      contentType: contentType,
      size: fileSize
    };
    profile.markModified('profilePhoto');
    await profile.save();
    // console.log("userId: ", userId);
    const savedProfile = await Profile.findOne({ userId });
    // console.log("savedProfile: ", savedProfile);
    // console.log('✅ Saved successfully:', {
    //   hasData: !!(savedProfile.profilePhoto && savedProfile.profilePhoto.data),
    //   dataLength: savedProfile.profilePhoto?.data?.length
    // });

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      hasPhoto: true
    });

  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({ success: false, message: 'Error uploading profile photo' });
  }
});

// Get profile photo by profile ID
router.get('/photo/:profileId', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.profileId);
    
    if (!profile || !profile.profilePhoto || !profile.profilePhoto.data) {
      return res.status(404).json({ success: false, message: 'Profile photo not found' });
    }

    res.set('Content-Type', profile.profilePhoto.contentType);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(profile.profilePhoto.data);

  } catch (error) {
    console.error('Error fetching profile photo by profile id:', error);
    res.status(500).json({ success: false, message: 'Error fetching profile photo' });
  }
});

// Get profile photo by cardId (for public card view)
router.get('/photo/card/:cardId', async (req, res) => {
  try {
    const profile = await Profile.findOne({ cardId: req.params.cardId });
    
    if (!profile || !profile.profilePhoto || !profile.profilePhoto.data) {
      return res.status(404).json({ success: false, message: 'Profile photo not found' });
    }

    res.set('Content-Type', profile.profilePhoto.contentType);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(profile.profilePhoto.data);

  } catch (error) {
    console.error('Error fetching profile photo by cardid:', error);
    res.status(500).json({ success: false, message: 'Error fetching profile photo' });
  }
});

// Delete profile photo
router.delete('/delete-profile-photo', authenticateToken, async (req, res) => {
  try {
    const userId = toObjectId(req.user.userId || req.user._id);
    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    profile.profilePhoto = undefined;
    await profile.save();

    res.json({
      success: true,
      message: 'Profile photo deleted successfully',
      hasPhoto: false
    });

  } catch (error) {
    console.error('Error deleting profile photo:', error);
    res.status(500).json({ success: false, message: 'Error deleting profile photo' });
  }
});
/**
 * ----- End of the code --------
 */

// Regenerate QR codes manually
router.post('/regenerate-qr', authenticateToken, async (req, res) => {
  try {
    const { qrOptions = {}, generateAll = true } = req.body;
    const userId = toObjectId(req.user.userId || req.user._id);
    let profile = await Profile.findOne({ userId });

    // const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // console.log(`🔄 Manually regenerating QR codes for: ${profile.name}`);

    // Delete old QR codes
    if (profile.qrCodes && profile.qrCodes.length > 0) {
      await QRService.deleteOldQRCodes(profile.qrCodes);
    }

    let newQRCodes = [];

    if (generateAll) {
      // Generate all formats
      newQRCodes = await QRService.generateMultipleFormats(profile);
    } else {
      // Generate only standard QR code with custom options
      const qrData = await QRService.generateProfileQR(profile, qrOptions);
      newQRCodes = [{ type: 'standard', ...qrData }];
    }

    // Update profile
    profile.qrCodes = newQRCodes;
    profile.primaryQR = newQRCodes.find(qr => qr.type === 'standard')?._id;
    await profile.save();

    // console.log(`✅ Regenerated ${newQRCodes.length} QR codes`);

    res.json({
      success: true,
      message: 'QR codes regenerated successfully',
      qrCodes: newQRCodes,
      primaryQR: profile.getPrimaryQR(),
      count: newQRCodes.length
    });
  } catch (error) {
    console.error('QR regeneration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error regenerating QR codes',
      error: error.message
    });
  }
});

// Get specific QR code by type
router.get('/qr/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { download = false } = req.query;

    const userId = toObjectId(req.user.userId || req.user._id);
    let profile = await Profile.findOne({ userId });
    // const profile = await Profile.findOne({ userId: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const qrCode = profile.getQRByType(type);
    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: `QR code type '${type}' not found`
      });
    }

    if (download) {
      // Serve the QR code file for download
      // console.log("Download qr code condition");
      const filePath = path.join(__dirname, '../uploads/qr-codes', qrCode.filename);

      try {
        await fs.access(filePath);
        res.download(filePath, `${profile.name}-${type}-qr.png`);
      } catch (fileError) {
        return res.status(404).json({
          success: false,
          message: 'QR code file not found'
        });
      }
    } else {
      res.json({
        success: true,
        qrCode: qrCode
      });
    }
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving QR code'
    });
  }
});

// Generate custom QR code
router.post('/generate-custom-qr', authenticateToken, async (req, res) => {
  try {
    const {
      size = 400,
      darkColor = '#000000',
      lightColor = '#FFFFFF',
      margin = 2,
      trackingParams = {},
      saveToProfile = true
    } = req.body;

    const userId = toObjectId(req.user.userId || req.user._id);
    let profile = await Profile.findOne({ userId });

    // const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // console.log(`🎨 Generating custom QR code for: ${profile.name}`);

    // Generate custom QR code
    const qrOptions = { size, darkColor, lightColor, margin };
    let customQR;

    if (Object.keys(trackingParams).length > 0) {
      customQR = await QRService.generateTrackableQR(profile, {
        ...trackingParams,
        size,
        darkColor,
        lightColor
      });
      customQR.type = 'trackable';
    } else {
      customQR = await QRService.generateProfileQR(profile, qrOptions);
      customQR.type = 'custom';
    }

    if (saveToProfile) {
      // Add to profile's QR codes
      profile.qrCodes.push(customQR);
      await profile.save();
    }

    res.json({
      success: true,
      message: 'Custom QR code generated successfully',
      qrCode: customQR,
      saved: saveToProfile
    });
  } catch (error) {
    console.error('Custom QR generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating custom QR code',
      error: error.message
    });
  }
});

// Upload custom QR code
router.post('/upload-qr', authenticateToken, upload.single('qrCode'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = toObjectId(req.user.userId || req.user._id);
    let profile = await Profile.findOne({ userId });
    // const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Process image with sharp
    const processedFileName = `uploaded-qr-${Date.now()}.png`;
    const processedPath = path.join(path.dirname(req.file.path), processedFileName);

    await sharp(req.file.path)
      .resize(400, 400, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
      .png({ quality: 90 })
      .toFile(processedPath);

    // Delete original file
    await fs.unlink(req.file.path);

    // Update profile
    profile.uploadedQR = {
      url: `/uploads/${req.user._id}/${processedFileName}`,
      filename: processedFileName
    };

    await profile.save();

    // console.log(`📤 Custom QR uploaded for: ${profile.name}`);

    res.json({
      success: true,
      message: 'QR code uploaded successfully',
      qrUrl: profile.uploadedQR.url
    });
  } catch (error) {
    console.error('QR upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading QR code'
    });
  }
});

// Bulk QR operations
router.post('/bulk-qr-operations', authenticateToken, async (req, res) => {
  try {
    const { operation, options = {} } = req.body; // operations: 'regenerate', 'delete', 'export'

    const userId = toObjectId(req.user.userId || req.user._id);
    let profile = await Profile.findOne({ userId });

    // const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    let result = {};

    switch (operation) {
      case 'regenerate':
        // console.log(`🔄 Bulk regenerating QR codes for: ${profile.name}`);

        // Delete old QR codes
        if (profile.qrCodes && profile.qrCodes.length > 0) {
          await QRService.deleteOldQRCodes(profile.qrCodes);
        }

        // Generate new ones
        const newQRCodes = await QRService.generateMultipleFormats(profile);
        profile.qrCodes = newQRCodes;
        profile.primaryQR = newQRCodes.find(qr => qr.type === 'standard')?._id;
        await profile.save();

        result = {
          operation: 'regenerate',
          count: newQRCodes.length,
          qrCodes: newQRCodes
        };
        break;

      case 'delete':
        // console.log(`🗑️ Bulk deleting QR codes for: ${profile.name}`);

        if (profile.qrCodes && profile.qrCodes.length > 0) {
          await QRService.deleteOldQRCodes(profile.qrCodes);
          profile.qrCodes = [];
          profile.primaryQR = null;
          await profile.save();
        }

        result = {
          operation: 'delete',
          message: 'All QR codes deleted'
        };
        break;

      case 'export':
        result = {
          operation: 'export',
          qrCodes: profile.qrCodes.map(qr => ({
            type: qr.type,
            url: qr.url,
            dimensions: qr.dimensions,
            standaloneUrl: qr.standaloneUrl,
            generatedAt: qr.generatedAt
          }))
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid bulk operation'
        });
    }

    res.json({
      success: true,
      message: `Bulk ${operation} completed successfully`,
      result: result
    });
  } catch (error) {
    console.error('Bulk QR operation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk QR operation',
      error: error.message
    });
  }
});

// Get QR code analytics
router.get('/qr-analytics', authenticateToken, async (req, res) => {
  try {

    const userId = toObjectId(req.user.userId || req.user._id);
    let profile = await Profile.findOne({ userId });
    // const profile = await Profile.findOne({ userId: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Get QR code specific analytics
    const qrAnalytics = await Analytics.aggregate([
      {
        $match: {
          profileId: profile._id,
          'eventData.source': 'qr_code'
        }
      },
      {
        $group: {
          _id: '$event',
          count: { $sum: 1 },
          sources: { $push: '$eventData.source' },
          dates: { $push: '$timestamp' }
        }
      }
    ]);

    const qrStats = {
      totalQRCodes: profile.qrCodes?.length || 0,
      primaryQR: profile.getPrimaryQR(),
      qrTypes: profile.qrCodes?.map(qr => qr.type) || [],
      lastGenerated: profile.qrCodes?.length > 0
        ? Math.max(...profile.qrCodes.map(qr => new Date(qr.generatedAt)))
        : null,
      analytics: qrAnalytics,
      standaloneUrl: profile.generateStandaloneUrl()
    };

    res.json({
      success: true,
      qrStats: qrStats
    });
  } catch (error) {
    console.error('QR analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving QR analytics'
    });
  }
});

// Delete profile (with QR cleanup)
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = toObjectId(req.user.userId || req.user._id);
    let profile = await Profile.findOne({ userId });

    // const profile = await Profile.findOne({ userId: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // console.log(`🗑️ Deleting profile and QR codes for: ${profile.name}`);

    // Delete all QR code files
    if (profile.qrCodes && profile.qrCodes.length > 0) {
      await QRService.deleteOldQRCodes(profile.qrCodes);
    }

    // Delete uploaded files directory
    const uploadDir = path.join(__dirname, '../uploads', req.user._id.toString());
    try {
      await fs.rmdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error deleting upload directory:', error);
    }

    // Delete analytics
    await Analytics.deleteMany({ profileId: profile._id });

    // Delete profile
    await Profile.findByIdAndDelete(profile._id);

    // Update user reference
    await User.findByIdAndUpdate(req.user._id, { $unset: { profile: 1 } });

    res.json({
      success: true,
      message: 'Profile and all QR codes deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting profile'
    });
  }
});

// Get profile analytics (existing endpoint updated)
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = toObjectId(req.user.userId || req.user._id);
    let profile = await Profile.findOne({ userId });
    // const profile = await Profile.findOne({ userId: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await Analytics.aggregate([
      {
        $match: {
          profileId: profile._id,
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            event: '$event',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.event',
          data: {
            $push: {
              date: '$_id.date',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      }
    ]);

    const totalViews = await Analytics.countDocuments({
      profileId: profile._id,
      event: 'view'
    });

    // QR-specific analytics
    const qrViews = await Analytics.countDocuments({
      profileId: profile._id,
      event: 'view',
      'eventData.ref': 'qr'
    });

    res.json({
      success: true,
      analytics: {
        totalViews,
        qrViews,
        qrViewsPercentage: totalViews > 0 ? ((qrViews / totalViews) * 100).toFixed(1) : 0,
        profileViews: profile.views,
        lastViewed: profile.lastViewed,
        recentActivity: analytics,
        cardId: profile.cardId,
        standaloneUrl: profile.generateStandaloneUrl(),
        qrCodes: {
          total: profile.qrCodes?.length || 0,
          types: profile.qrCodes?.map(qr => qr.type) || [],
          primaryQR: profile.getPrimaryQR()
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analytics'
    });
  }
});

module.exports = router;