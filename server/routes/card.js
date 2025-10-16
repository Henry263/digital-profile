// routes/card.js
const express = require('express');
const QRCode = require('qrcode');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const crypto = require('crypto');
const JSZip = require('jszip');
const forge = require('node-forge');

const fs = require('fs').promises;
const fsnonpromise = require('fs');
const Profile = require('../models/Profile');
const Analytics = require('../models/Analytics');
const ShortUrl = require('../models/ShortUrl');
const { generateShortCode } = require('../utils/shortUrlGenerator');

const router = express.Router();
const { toObjectId } = require('../utils/dbHelpers');


const AnalyticsHelper = require('../utils/analyticsHelper');
const { trackProfileView } = require('../middleware/trackAnalytics');


const sharedfunctions = require('../services/sharedfunctions')
let envVariables = sharedfunctions.readenvironmentconfig();


async function findProfileBySlugOrCardId(identifier) {
  // console.log("identifier in findProfileBySlugOrCardId", identifier);
  // Try to find by slug first (user-friendly URL)
  let profile = await Profile.findOne({
    slug: identifier,
    isPublic: true
  });

  // If not found by slug, try by cardId (fallback for old URLs)
  if (!profile) {
    profile = await Profile.findOne({
      cardId: identifier,
      isPublic: true
    });
  }

  return profile;
}


// Get client's public IP
router.get('/get-client-ip', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.headers['x-real-ip'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               req.ip;
    
    // For localhost, try to get real public IP
    if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') {
      try {
        const response = await axios.get('https://api.ipify.org?format=json', {
          timeout: 3000
        });
        return res.json({ 
          success: true, 
          ip: response.data.ip,
          isLocal: true 
        });
      } catch (error) {
        return res.json({ 
          success: true, 
          ip: '127.0.0.1',
          isLocal: true 
        });
      }
    }
    
    res.json({ 
      success: true, 
      ip,
      isLocal: false 
    });
    
  } catch (error) {
    console.error('Get IP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting IP' 
    });
  }
});

// Update main card route

// Debug route - add this temporarily at the top of your routes
router.get('/debug/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;
    // console.log(`🔍 Debug lookup for cardId: ${cardId}`);

    const profile = await Profile.findOne({ cardId: cardId });

    res.json({
      success: true,
      debug: {
        cardId: cardId,
        found: !!profile,
        profile: profile ? {
          name: profile.name,
          isPublic: profile.isPublic,
          cardId: profile.cardId,
          createdAt: profile.createdAt
        } : null,
        allProfiles: await Profile.find({}).select('cardId name isPublic').limit(5)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get public card by cardId
// Get public card as HTML page
router.get('/:identifier', async (req, res) => {
  // console.log("Finding the by slug");
  try {
    const { identifier } = req.params;
    // console.log(`Looking for card with identifier: ${identifier}`);
    
    const profile = await findProfileBySlugOrCardId(identifier);
    // console.log("profile data:", profile);
    // const profile = await Profile.findOne({ 
    //   cardId: cardId,
    //   isPublic: true 
    // }).populate('userId', 'name email avatar');
    // console.log("Profile from Mongo ", profile);
    if (!profile) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Card Not Found</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error { color: #e74c3c; font-size: 24px; margin-bottom: 20px; }
                .message { color: #7f8c8d; font-size: 16px; }
            </style>
        </head>
        <body>
            <div class="error">🔍 Card Not Found</div>
            <div class="message">This business card is not available or has been set to private.</div>
        </body>
        </html>
      `);
    }

    // Record analytics
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const referrer = req.get('Referrer');


    // Track analytics
    await AnalyticsHelper.trackEvent(
      profile._id, 
      'view', 
      {
        ref: req.query.ref || 'direct',
        cardId: profile.cardId,
        method: 'public_access',
        accessedVia: identifier === profile.slug ? 'slug' : 'cardId'
      }, 
      req
    );

    // Increment profile views
    await profile.incrementViews();

    // Read HTML template
    const templatePath = path.join(__dirname, '../templates/card-template.html');

    let htmlTemplate;
    // console.log("From server", templatePath);
    try {

      htmlTemplate = await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      // console.log("Fallback");
      // Fallback to inline template if file doesn't exist
      htmlTemplate = getInlineCardTemplate();
    }
    // // console.log('Raw profile.socialMedia from DB:', profile.socialMedia);

    // ADD THIS HELPER FUNCTION at the top of your route handler file
    const cleanSocialMediaData = (socialMedia) => {
      const cleaned = {};
      // console.log("Input socialMedia:", socialMedia);
      // console.log("socialMedia exists?", !!socialMedia);

      if (socialMedia) {
        const keys = Object.keys(socialMedia);
        // console.log("Keys found:", keys);

        keys.forEach(key => {
          // console.log("----");
          const value = socialMedia[key];

          if (value && typeof value === 'string') {
            const trimmed = value.trim();
            // console.log(`Trimmed: "${trimmed}"`);
            // console.log(`Trimmed not empty? ${trimmed !== ''}`);

            if (trimmed !== '') {
              // console.log("✅ Condition met - adding to cleaned object");
              let url = trimmed;

              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
                // console.log(`Added protocol: ${url}`);
              }

              cleaned[key] = url;
            } else {
              // console.log("❌ Trimmed value is empty");
            }
          } else {
            // console.log("❌ Value doesn't exist or is not a string");
          }
        });
      }

      // console.log("Final cleaned object:", cleaned);
      return cleaned;
    };

    const plainSocialMedia = profile.socialMedia && profile.socialMedia.toObject ?
      profile.socialMedia.toObject() :
      profile.socialMedia;

    // if (profile.showPhoneNumber !== false) {
    //     contactData.phone = profile.phone || '';
    //     contactData.mobile = profile.mobile || '';
    // }
    // MODIFY your existing templateData preparation
    const templateData = {
      cardId: profile.cardId,
      name: profile.name || 'Anonymous',
      title: profile.title || '',
      organization: profile.organization || '',
      phone: profile.showPhoneNumber !== false ? (profile.phone || '') : '',
      mobile: profile.showPhoneNumber !== false ? (profile.mobile || '') : '',
      email: profile.email || '',
      website: profile.website || '',
      address: profile.address || '',
      notes: profile.notes || '',
      views: profile.views || 0,
      socialMedia: profile.socialMedia || {},
      initials: generateInitials(profile.name || 'AN'),
      hasProfilePhoto: profile.hasProfilePhoto(),
      standaloneUrl: profile.generateStandaloneUrl(),
      profileshortUrl: await profile.getOrCreateShortUrl(),
      hasSocialMedia: hasSocialMediaLinks(profile.socialMedia),

      // ADD THIS NEW FIELD for clean JSON injection
      contactDataJSON: JSON.stringify({
        phone: profile.showPhoneNumber !== false ? (profile.phone || '') : '',
        mobile: profile.showPhoneNumber !== false ? (profile.mobile || '') : '',
        email: profile.email || '',
        website: profile.website || '',
        address: profile.address || '',
        notes: profile.notes || '',
        cardId: profile.cardId,
        country: profile.country || { name: '', code: '' },
        state: profile.state || { name: '', id: '', code: '' },
        city: profile.city || { name: '', id: '' },
        socialMedia: cleanSocialMediaData(plainSocialMedia),
        hasProfilePhoto: profile.hasProfilePhoto(),
        initials: profile.getInitials ? profile.getInitials() : getInitials(profile.name)
      })
    };
    // console.log("return data: ", templateData)
    // KEEP your existing template replacement logic
    let renderedHtml = htmlTemplate;

    // Replace template variables
    Object.keys(templateData).forEach(key => {
      const value = templateData[key];

      if (typeof value === 'object' && value !== null) {
        // Handle nested objects (like socialMedia)
        Object.keys(value).forEach(subKey => {
          const regex = new RegExp(`{{${key}\\.${subKey}}}`, 'g');
          renderedHtml = renderedHtml.replace(regex, value[subKey] || '');
        });
      } else {
        const regex = new RegExp(`{{${key}}}`, 'g');
        renderedHtml = renderedHtml.replace(regex, value || '');
      }
    });

    // Handle conditional sections
    renderedHtml = handleConditionals(renderedHtml, templateData);

    // ADD these debug logs right before sending the response (REMOVE after testing)
    // console.log('Raw profile.socialMedia from DB:', profile.socialMedia);
    const plainProfile = profile.socialMedia.toObject ? profile.socialMedia.toObject() : profile.socialMedia;

    // console.log('Cleaned socialMedia for frontend:', cleanSocialMediaData(plainProfile));
    // console.log('contactDataJSON:', templateData.contactDataJSON);

    res.set('Content-Type', 'text/html');
    res.send(renderedHtml);

  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).send(`
      <html>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2 style="color: #e74c3c;">⚠️ Server Error</h2>
        <p style="color: #7f8c8d;">Unable to load the business card. Please try again later.</p>
      </body>
      </html>
    `);
  }
});


// Generate vCard for download
// Enhanced vCard generation with notes and URL
router.get('/:identifier/vcard', async (req, res) => {
  try {
    const { identifier } = req.params;

    const profile = await findProfileBySlugOrCardId(identifier);
    // const profile = await Profile.findOne({ 
    //   cardId: cardId,
    //   isPublic: true 
    // });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    // Record analytics
    // await Analytics.create({
    //   profileId: profile._id,
    //   event: 'download',
    //   eventData: {
    //     slug: identifier,
    //     type: 'vcard'
    //   },
    //   ip: req.ip,
    //   userAgent: req.get('User-Agent')
    // });

    await AnalyticsHelper.trackEvent(
      profile._id, 
      'view', 
      {
        ref: req.query.ref || 'direct',
        cardId: profile.cardId,
        method: 'public_access',
        accessedVia: identifier === profile.slug ? 'slug' : 'cardId'
      }, 
      req
    );
    // Generate enhanced vCard content with notes and URL
    const vCardContent = generateEnhancedVCard(profile);

    res.set({
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${profile.name.replace(/\s+/g, '-')}.vcf"`
    });

    res.send(vCardContent);
  } catch (error) {
    console.error('vCard generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating vCard'
    });
  }
});

// Generate Apple Wallet pass
router.get('/:identifier/wallet-pass', async (req, res) => {
  try {
    // console.log("Wallet pass: ", req.params);
    const { identifier } = req.params;
    // isPublic: true  add in the filter if you want to show all profiles.
    //  const profile = await findProfileBySlugOrCardId(identifier);
    const profile = await Profile.findOne({
      slug: identifier,

    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    // Record analytics
    // await Analytics.create({
    //   profileId: profile._id,
    //   event: 'download',
    //   eventData: {
    //     slug: identifier,
    //     type: 'wallet_pass'
    //   },
    //   ip: req.ip,
    //   userAgent: req.get('User-Agent')
    // });

    await AnalyticsHelper.trackEvent(
      profile._id, 
      'view', 
      {
        ref: req.query.ref || 'direct',
        cardId: profile.cardId,
        method: 'public_access',
        accessedVia: identifier === profile.slug ? 'slug' : 'cardId'
      }, 
      req
    );

    // Generate Apple Wallet pass data
    const passData = generateWalletPass(profile);

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${profile.name.replace(/\s+/g, '-')}-wallet-pass.json"`
    });

    res.json(passData);
  } catch (error) {
    console.error('Wallet pass generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating wallet pass'
    });
  }
});


// Alternative simple pass generation (without signing)

// Alternative simple pass generation (without signing)
async function generateSimpleWalletPass(profile) {
  const zip = new JSZip();

  // Create a more complete pass.json
  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: "pass.com.qrmypro.businesscard",
    serialNumber: profile.slug,
    teamIdentifier: "DEMO123456",
    description: `${profile.name}'s Digital Business Card`,
    organizationName: "QR My Pro",

    // Add required visual elements
    backgroundColor: "rgb(255, 255, 255)",
    foregroundColor: "rgb(0, 0, 0)",
    labelColor: "rgb(100, 100, 100)",

    // Generic pass structure
    generic: {
      primaryFields: [{
        key: "name",
        label: "Name",
        value: profile.name
      }],
      secondaryFields: [{
        key: "title",
        label: "Title",
        value: profile.title || profile.designation || "Professional"
      }],
      auxiliaryFields: [{
        key: "company",
        label: "Company",
        value: profile.company || "QR My Pro"
      }],
      backFields: [
        {
          key: "phone",
          label: "Phone",
          value: profile.phone || ""
        },
        {
          key: "email",
          label: "Email",
          value: profile.email || ""
        },
        {
          key: "website",
          label: "Website",
          value: `${envVariables.BASE_URL}/card/${profile.slug}`
        }
      ]
    },

    // QR Code/Barcode
    barcodes: [{
      format: "PKBarcodeFormatQR",
      message: `${envVariables.BASE_URL}/card/${profile.slug}`,
      messageEncoding: "iso-8859-1"
    }],

    // Add expiration date (1 year from now)
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  };

  // Add pass.json
  const passJsonString = JSON.stringify(passJson, null, 2);
  zip.file('pass.json', passJsonString);

  // Create simple icon files (1x1 pixel transparent PNG)
  const transparentPixel = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x1D, 0x00, 0x00, 0x00, 0x1D,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1E, 0x05, 0x61, 0x7B, 0x00, 0x00, 0x00,
    0x09, 0x70, 0x48, 0x59, 0x73, 0x00, 0x00, 0x0B, 0x13, 0x00, 0x00, 0x0B,
    0x13, 0x01, 0x00, 0x9A, 0x9C, 0x18, 0x00, 0x00, 0x00, 0x20, 0x49, 0x44,
    0x41, 0x54, 0x48, 0x4B, 0x63, 0x60, 0x18, 0x05, 0xA3, 0x60, 0x14, 0x8C,
    0x82, 0x51, 0x30, 0x0A, 0x46, 0xC1, 0x28, 0x18, 0x05, 0xA3, 0x60, 0x14,
    0x8C, 0x82, 0x51, 0x30, 0x0A, 0x00, 0x00, 0xFF, 0xFF, 0x03, 0x00, 0x00,
    0x02, 0x00, 0x01, 0x4F, 0x6D, 0xB0, 0xD8, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);

  // Add required icon files (Apple Wallet needs these)
  zip.file('icon.png', transparentPixel);
  zip.file('icon@2x.png', transparentPixel);
  zip.file('logo.png', transparentPixel);
  zip.file('logo@2x.png', transparentPixel);

  // Generate manifest with all files
  const manifest = {};
  const files = ['pass.json', 'icon.png', 'icon@2x.png', 'logo.png', 'logo@2x.png'];

  for (const fileName of files) {
    let fileData;
    if (fileName === 'pass.json') {
      fileData = Buffer.from(passJsonString, 'utf8');
    } else {
      fileData = transparentPixel;
    }
    const hash = crypto.createHash('sha1').update(fileData).digest('hex');
    manifest[fileName] = hash;
  }

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  return await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });
}
// Apple Wallet Pass API Endpoint
router.get('/:identifier/apple-wallet-pass', async (req, res) => {
  try {
    const { identifier } = req.params;

    const profile = await Profile.findOne({
      slug: identifier,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    // Record analytics
    // await Analytics.create({
    //   profileId: profile._id,
    //   event: 'download',
    //   eventData: {
    //     slug: identifier,
    //     type: 'wallet_pass'
    //   },
    //   ip: req.ip,
    //   userAgent: req.get('User-Agent')
    // });

    await AnalyticsHelper.trackEvent(
      profile._id, 
      'view', 
      {
        ref: req.query.ref || 'direct',
        cardId: profile.cardId,
        method: 'public_access',
        accessedVia: identifier === profile.slug ? 'slug' : 'cardId'
      }, 
      req
    );

    // Generate the .pkpass file
    const pkpassBuffer = await generateSimpleWalletPass(profile);

    console.log('Generated pkpass buffer size:', pkpassBuffer.length);
    // // Set headers for Apple Wallet pass download
    // res.set({
    //   'Content-Type': 'application/vnd.apple.pkpass',
    //   'Content-Disposition': `attachment; filename="${profile.name.replace(/\s+/g, '-')}.pkpass"`,
    //   'Content-Length': pkpassBuffer.length,
    //   'Cache-Control': 'no-cache, no-store, must-revalidate',
    //   'Pragma': 'no-cache',
    //   'Expires': '0',
    //   'X-Content-Type-Options': 'nosniff'
    // });

    // res.send(pkpassBuffer);

    // Save to temporary file
    const tempFilePath = path.join(__dirname, '../temp', `${identifier}.pkpass`);

    // Ensure temp directory exists
    const tempDir = path.dirname(tempFilePath);
    if (!fsnonpromise.existsSync(tempDir)) {
      fsnonpromise.mkdirSync(tempDir, { recursive: true });
    }

    // Write file to disk
    fsnonpromise.writeFileSync(tempFilePath, pkpassBuffer);

    // Send file
    res.download(tempFilePath, `${profile.name.replace(/\s+/g, '-')}.pkpass`, (err) => {
      if (err) {
        console.log("downlaod card error: ", err.message);
        console.error('Download error:', err);
      }

      // Clean up temp file
      try {
        fsnonpromise.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    });

  } catch (error) {
    console.error('Apple Wallet pass generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating Apple Wallet pass'
    });
  }
});

// Get QR code image
router.get('/:identifier/qr', async (req, res) => {
  try {
    // console.log("req Param: ", req.params);
    const { identifier } = req.params;
    const { size = 400, download = false } = req.query;

    // console.log(`QR Request - CardId: ${identifier}, Size: ${size}`);
    const profile = await findProfileBySlugOrCardId(identifier);
    // Debug: Check if we can find the profile at all
    const allProfiles = await Profile.find({}).select('cardId name isPublic');
    // console.log(`Total profiles in DB: ${allProfiles.length}`);
    // console.log(`Looking for cardId: "${cardId}"`);
    // console.log(`Available cardIds:`, allProfiles.map(p => `"${p.cardId}"`));

    // const profile = await Profile.findOne({ cardId: cardId });
    // console.log(`Profile lookup result:`, profile ? `Found: ${profile.name} (isPublic: ${profile.isPublic})` : 'Not found');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `Card not found for cardId: ${identifier}`,
        debug: {
          searchedCardId: identifier,
          availableCardIds: allProfiles.map(p => p.cardId)
        }
      });
    }
    // console.log(`Generating QR for: ${profile.name} (slug: ${profile.slug}, cardId: ${profile.cardId})`);

    if (!profile.isPublic) {
      // console.log(`Profile found but not public: ${profile.name}`);
      return res.status(404).json({
        success: false,
        message: 'Card is not public'
      });
    }

    // console.log(`Generating QR for: ${profile.name}`);

    const standaloneUrl = profile.generateStandaloneUrl();
    // console.log(`Standalone URL: ${standaloneUrl}`);

   
    
    // Generate QR code
    const qrCodeBuffer = await QRCode.toBuffer(standaloneUrl, {
      width: parseInt(size),
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // console.log(`QR code generated successfully, size: ${qrCodeBuffer.length} bytes`);

    if (download === 'true') {
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="qr-${profile.name.replace(/\s+/g, '-')}.png"`
      });
    } else {
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="qr-${identifier}.png"`
      });
    }

    res.send(qrCodeBuffer);
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating QR code',
      error: error.message
    });
  }
});

// Download styled QR card with branding
// Download styled QR card with branding

router.get('/:identifier/download-styled-qr', async (req, res) => {
  try {
    const { identifier } = req.params;
    const profile = await findProfileBySlugOrCardId(identifier);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    if (!profile.isPublic) {
      return res.status(404).json({
        success: false,
        message: 'Card is not public'
      });
    }

    // Card dimensions - INCREASED WIDTH
    const width = 850;
    const height = 750; // Increased height slightly
    
    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    
    // Background gradient (blue gradient)
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Generate QR code - SAME SIZE
    const standaloneUrl = profile.generateStandaloneUrl();
    const qrCodeDataUrl = await QRCode.toDataURL(standaloneUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Load and draw QR code
    const qrImage = await loadImage(qrCodeDataUrl);
    const qrSize = 276;
    const qrX = (width - qrSize) / 2;
    const qrY = 100;
    const qrPadding = 10;
    const borderRadius = 4;
    
    // White background for QR code with rounded corners
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, qrX - qrPadding, qrY - qrPadding, qrSize + (qrPadding * 2), qrSize + (qrPadding * 2), borderRadius);
    ctx.fill();
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    // Details box section - INCREASED HEIGHT and positioned for overlapping photo
    const detailsBoxY = qrY + qrSize + 80; // More space for overlapping photo
    const detailsBoxHeight = 200; // INCREASED from 140
    const photoSize = 120; // Slightly larger photo
    const detailsBoxPadding = 40;
    const detailsBoxWidth = width - (detailsBoxPadding * 2);
    
    // Shadow for details box
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    
    // White details box with rounded corners
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, detailsBoxPadding, detailsBoxY, detailsBoxWidth, detailsBoxHeight, borderRadius);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Profile photo - CENTERED HORIZONTALLY and OVERLAPPING the white box
    const photoX = (width - photoSize) / 2; // Centered
    const photoY = detailsBoxY - (photoSize / 2); // Half above, half below the box edge
    
    if (profile.profilePhoto && profile.profilePhoto.data) {
      try {
        const photoBuffer = profile.profilePhoto.data;
        const photoImage = await loadImage(photoBuffer);
        
        // Shadow for photo
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;
        
        // Draw circular photo
        ctx.save();
        ctx.beginPath();
        ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(photoImage, photoX, photoY, photoSize, photoSize);
        ctx.restore();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Border around photo
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
        ctx.stroke();
      } catch (photoError) {
        console.log('Could not load profile photo, using initials');
        drawInitialsCircle(ctx, profile, photoX, photoY, photoSize);
      }
    } else if (profile.profileImage && profile.profileImage.url) {
      try {
        const photoImage = await loadImage(profile.profileImage.url);
        
        // Shadow for photo
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(photoImage, photoX, photoY, photoSize, photoSize);
        ctx.restore();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
        ctx.stroke();
      } catch (photoError) {
        console.log('Could not load profile image URL, using initials');
        drawInitialsCircle(ctx, profile, photoX, photoY, photoSize);
      }
    } else {
      // Draw initials circle with shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5;
      
      drawInitialsCircle(ctx, profile, photoX, photoY, photoSize);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // ============ TEXT RENDERING - CENTERED LAYOUT ============
    
    // Text starts below the photo
    const textStartY = photoY + photoSize + 30; // Start below photo with spacing
    const maxTextWidth = detailsBoxWidth - 80; // Padding on both sides
    
    // Helper function: Dynamic font sizing (NO WRAPPING)
    function getDynamicFontSize(text, baseSize, minSize, maxWidth, fontWeight = '') {
      let fontSize = baseSize;
      ctx.font = `${fontWeight} ${fontSize}px Arial`;
      
      // Reduce font size until text fits or minimum is reached
      while (ctx.measureText(text).width > maxWidth && fontSize > minSize) {
        fontSize -= 1;
        ctx.font = `${fontWeight} ${fontSize}px Arial`;
      }
      
      return fontSize;
    }

    // CENTER ALIGN ALL TEXT
    ctx.textAlign = 'center';
    const centerX = width / 2; // Center of the canvas

    // Draw NAME with dynamic font sizing (min 12px)
    const name = profile.name || 'Name';
    const nameFontSize = getDynamicFontSize(name, 32, 12, maxTextWidth, 'bold');
    ctx.font = `bold ${nameFontSize}px Arial`;
    ctx.fillStyle = '#1f2937'; // Dark gray for name
    ctx.fillText(name, centerX, textStartY);

    // Calculate next Y position
    let currentY = textStartY + 28;

    // Draw TITLE/ROLE (if exists) - min 10px
    if (profile.title) {
      const titleFontSize = getDynamicFontSize(profile.title, 20, 10, maxTextWidth);
      ctx.font = `${titleFontSize}px Arial`;
      ctx.fillStyle = '#666'; // Medium gray
      ctx.fillText(profile.title, centerX, currentY);
      currentY += 24;
    }

    // Draw EMAIL (separate row) - min 10px
    if (profile.email) {
      const emailFontSize = getDynamicFontSize(profile.email, 18, 10, maxTextWidth);
      ctx.font = `${emailFontSize}px Arial`;
      ctx.fillStyle = '#666'; // Medium gray
      ctx.fillText(profile.email, centerX, currentY);
      currentY += 22;
    }

    // Draw ORGANIZATION (separate row) - min 10px
    if (profile.organization) {
      const orgFontSize = getDynamicFontSize(profile.organization, 18, 10, maxTextWidth);
      ctx.font = `${orgFontSize}px Arial`;
      ctx.fillStyle = '#666'; // Medium gray
      ctx.fillText(profile.organization, centerX, currentY);
    }

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');

    // Set headers for download
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="qr-card-${profile.name.replace(/\s+/g, '-')}.png"`,
      'Content-Length': buffer.length
    });

    res.send(buffer);
  } catch (error) {
    console.error('Styled QR card generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating styled QR card',
      error: error.message
    });
  }
});
// Helper function to draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Helper function to draw initials circle
function drawInitialsCircle(ctx, profile, x, y, size) {
  // Shadow for photo
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  
  // Circle background
  ctx.fillStyle = '#667eea'; // Purple-blue gradient color
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Reset shadow for text
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // Initials text
  const initials = profile.getInitials ? profile.getInitials() : 
    (profile.name ? profile.name.substring(0, 2).toUpperCase() : 'U');
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${size / 2.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, x + size / 2, y + size / 2);
}

// Track social media clicks
// Keep your existing tracking routes
router.post('/:cardId/track/:platform', async (req, res) => {
  try {
    const { cardId, platform } = req.params;

    const profile = await Profile.findOne({ cardId: cardId });

    if (profile) {
      // await Analytics.create({
      //   profileId: profile._id,
      //   event: 'social_click',
      //   eventData: {
      //     cardId: cardId,
      //     platform: platform
      //   },
      //   ip: req.ip,
      //   userAgent: req.get('User-Agent')
      // });

      await AnalyticsHelper.trackEvent(
        profile._id, 
        'view', 
        {
          ref: req.query.ref || 'direct',
          cardId: profile.cardId,
          method: 'public_access',
          accessedVia: cardId === profile.cardId ? 'slug' : 'cardId'
        }, 
        req
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    res.json({ success: false });
  }
});

// Track contact clicks
router.post('/:cardId/track/contact/:action', async (req, res) => {
  try {
    const { cardId, action } = req.params;
    // console.log("req.params: ", req.params);
    const profile = await Profile.findOne({ cardId: cardId });

    if (profile) {
      // await Analytics.create({
      //   profileId: profile._id,
      //   event: 'contact_click',
      //   eventData: {
      //     cardId: cardId,
      //     action: action
      //   },
      //   ip: req.ip,
      //   userAgent: req.get('User-Agent')
      // });

      await AnalyticsHelper.trackEvent(
        profile._id, 
        'view', 
        {
          ref: req.query.ref || 'direct',
          cardId: profile.cardId,
          method: 'public_access',
          accessedVia: cardId === profile.cardId ? 'slug' : 'cardId'
        }, 
        req
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Track contact error:', error);
    res.json({ success: false });
  }
});

// Search public cards
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;
    // isPublic: true  add in the filter if you want to show all profiles.
    const profiles = await Profile.find({

      $or: [
        { name: { $regex: query, $options: 'i' } },
        { title: { $regex: query, $options: 'i' } },
        { organization: { $regex: query, $options: 'i' } }
      ]
    })
      .select('cardId name title organization views createdAt')
      .limit(parseInt(limit))
      .sort({ views: -1, createdAt: -1 });

    res.json({
      success: true,
      results: profiles.map(profile => ({
        cardId: profile.cardId,
        name: profile.name,
        title: profile.title,
        organization: profile.organization,
        views: profile.views,
        url: profile.generateStandaloneUrl()
      }))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search error'
    });
  }
});

// Helper function to generate vCard content
function generateVCard(profile) {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile.name}`,
    `N:${profile.name.split(' ').reverse().join(';')};;;`,
    `ORG:${profile.organization}`,
    `TITLE:${profile.title}`,
    `TEL;TYPE=WORK,VOICE:${profile.phone}`,
    `TEL;TYPE=CELL:${profile.mobile}`,
    `EMAIL;TYPE=WORK:${profile.email}`,
    `URL:${profile.website}`,
    `ADR;TYPE=WORK:;;${profile.address}`,
    `NOTE:${profile.notes}`,
    'END:VCARD'
  ].join('\r\n');

  return vcard;
}

// Helper function to generate Apple Wallet pass
function generateWalletPass(profile) {
  return {
    formatVersion: 1,
    passTypeIdentifier: `pass.com.qrprofiles.${profile.cardId}`,
    serialNumber: profile.cardId,
    teamIdentifier: '',
    organizationName: profile.organization || 'QRProfile',
    description: `QR Business Card - ${profile.name}`,
    logoText: 'Digital Card',
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(102, 126, 234)',
    labelColor: 'rgb(255, 255, 255)',
    generic: {
      primaryFields: [
        {
          key: 'name',
          label: 'Digital Business Card',
          value: profile.name
        }
      ],
      secondaryFields: [
        {
          key: 'title',
          label: 'Title',
          value: profile.title
        },
        {
          key: 'company',
          label: 'Company',
          value: profile.organization
        }
      ],
      auxiliaryFields: [
        {
          key: 'url',
          label: 'Card URL',
          value: profile.generateStandaloneUrl().replace(/https?:\/\//, '')
        }
      ],
      backFields: [
        {
          key: 'instructions',
          label: 'How to Use',
          value: 'Show this QR code to others or share the URL to let them view your complete digital business card.'
        },
        {
          key: 'fullurl',
          label: 'Complete URL',
          value: profile.generateStandaloneUrl()
        },
        {
          key: 'phone',
          label: 'Phone',
          value: profile.phone
        },
        {
          key: 'email',
          label: 'Email',
          value: profile.email
        }
      ]
    },
    barcodes: [
      {
        message: profile.generateStandaloneUrl(),
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: `${profile.name} - Digital Business Card`
      }
    ],
    relevantDate: new Date().toISOString(),
    webServiceURL: profile.generateStandaloneUrl(),
    authenticationToken: `smartlife_${profile.cardId}`
  };
}

// Helper functions
function generateInitials(name) {
  if (!name) return 'AN';
  return name.split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function hasSocialMediaLinks(socialMedia) {
  if (!socialMedia) return false;
  return Object.values(socialMedia).some(link => {
    return link && typeof link === 'string' && link.trim().length > 0;
  });
}

function handleConditionals(html, data) {
  // Handle {{#if condition}} blocks
  html = html.replace(/{{#if\s+([^}]+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
    const value = getNestedProperty(data, condition.trim());
    return value ? content : '';
  });

  return html;
}

function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}


function generateEnhancedVCard(profile) {
  // console.log("Profile data: ", profile);
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile.name || ''}`,
    `N:${(profile.name || '').split(' ').reverse().join(';')};;;`,
  ];

  // Add organization and title
  if (profile.organization) {
    lines.push(`ORG:${profile.organization}`);
  }
  if (profile.title) {
    lines.push(`TITLE:${profile.title}`);
  }
  if (profile.showPhoneNumber !== false) {
    if (profile.phone) {
      lines.push(`TEL;TYPE=WORK,VOICE:${profile.phone}`);
    }
    if (profile.mobile) {
      lines.push(`TEL;TYPE=CELL:${profile.mobile}`);
    }
  }
  if (profile.email) {
    lines.push(`EMAIL;TYPE=WORK:${profile.email}`);
  }
  if (profile.website) {
    lines.push(`URL:${profile.website}`);
  }

  // Add address
  if (profile.address) {
    lines.push(`ADR;TYPE=WORK:;;${profile.address.replace(/\n/g, ', ')}`);
  }

  // OPTION 2: Add profile photo (if available)
  if (profile.profileImage) {
    lines.push(`PHOTO;VALUE=URI:${profile.profileImage}`);
  }

  // Add QR code as custom field (your existing QR API)
  const cardUrl = `${envVariables.BASE_URL || 'https://www.qrmypro.com'}/card/${profile.slug}`;
  const qrCodeUrl = `${envVariables.BASE_URL || 'https://www.qrmypro.com'}/card/${profile.slug}/qr`;
  
  // Multiple ways to reference the QR code
  lines.push(`X-QR-CODE:${qrCodeUrl}`);
  lines.push(`X-QR-CODE-URL:${qrCodeUrl}`);
  
  // Some contact apps recognize these custom fields
  lines.push(`X-DIGITALCARD-QR:${qrCodeUrl}`);
  lines.push(`X-BUSINESSCARD-QR:${qrCodeUrl}`);

  // Add notes with card URL and QR info
  let noteContent = '';
  if (profile.notes) {
    noteContent += profile.notes;
  }

  // Always add the digital card URL
  if (noteContent) {
    noteContent += '\n\n';
  }
  noteContent += `Digital Card: ${cardUrl}`;
  // noteContent += `\nQR Code: ${qrCodeUrl}`;
  // noteContent += '\nScan the QR code to quickly access this digital business card.';

  lines.push(`NOTE:${noteContent}`);

  // Add social media URLs
  if (profile.socialMedia) {
    Object.entries(profile.socialMedia).forEach(([platform, url]) => {
      if (url && typeof url === 'string' && url.trim().length > 0) {
        lines.push(`X-SOCIALPROFILE;TYPE=${platform.toUpperCase()}:${url.trim()}`);
      }
    });
  }

  // Add card URL as a separate URL field
  lines.push(`URL;TYPE=DIGITAL-CARD:${cardUrl}`);
  
  // Add QR code URL as a separate URL field
  lines.push(`URL;TYPE=QR-CODE:${qrCodeUrl}`);

  // Add creation/update timestamp
  lines.push(`REV:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);

  lines.push('END:VCARD');

  return lines.join('\r\n');
}


/**
 * This is for dynamic template. Individual card for user.
 */
// In your Node.js server, register this helper

// Inline HTML template fallback
function getInlineCardTemplate() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}} - Digital Business Card</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
        }
        .card-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
        }
        .profile-section { text-align: center; margin-bottom: 32px; }
        .profile-avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea, #764ba2);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: white;
            font-size: 48px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2px;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
        .profile-name {
            font-size: 2.2rem;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 8px;
            line-height: 1.2;
        }
        .profile-title {
            font-size: 1.1rem;
            color: #667eea;
            font-weight: 600;
            margin-bottom: 4px;
        }
        .profile-organization {
            font-size: 1rem;
            color: #718096;
            font-weight: 500;
        }
        .contact-item {
            display: flex;
            align-items: center;
            padding: 16px 20px;
            margin-bottom: 12px;
            background: rgba(102, 126, 234, 0.08);
            border-radius: 16px;
            transition: all 0.3s ease;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
            border: 1px solid rgba(102, 126, 234, 0.1);
        }
        .contact-item:hover {
            background: rgba(102, 126, 234, 0.15);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
        }
        .contact-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            margin-right: 16px;
            flex-shrink: 0;
        }
        .contact-info { flex-grow: 1; }
        .contact-label {
            font-size: 0.85rem;
            color: #718096;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }
        .contact-value {
            font-size: 1.1rem;
            color: #2d3748;
            font-weight: 600;
        }
        .social-links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 16px;
            margin: 20px 0;
        }
        .social-link {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px 16px;
            background: rgba(102, 126, 234, 0.08);
            border-radius: 16px;
            text-decoration: none;
            color: #667eea;
            transition: all 0.3s ease;
            border: 1px solid rgba(102, 126, 234, 0.1);
        }
        .social-link:hover {
            background: rgba(102, 126, 234, 0.15);
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
        }
        .section-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: #2d3748;
            margin: 20px 0 15px 0;
            text-align: center;
        }
        .notes-section, .address-section {
            margin: 24px 0;
            padding: 20px;
            background: rgba(245, 87, 108, 0.08);
            border-radius: 16px;
            border-left: 4px solid #f5576c;
        }
        .actions-section {
            display: flex;
            justify-content: center;
            margin-top: 32px;
        }
        .action-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px 24px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 1rem;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }
        .btn-secondary {
            background: rgba(102, 126, 234, 0.1);
            color: #667eea;
            border: 2px solid rgba(102, 126, 234, 0.2);
        }
        .views-counter {
            display: inline-flex;
            align-items: center;
            background: rgba(102, 126, 234, 0.1);
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            color: #667eea;
            margin-top: 12px;
        }
        @media (max-width: 480px) {
            .card-container { padding: 24px; margin: 10px; }
            .profile-name { font-size: 1.8rem; }
            .actions-section { justify-content: center; }
        }
    </style>
</head>
<body>
    <div class="card-container">
        <div class="profile-section">
            <div class="profile-avatar">{{initials}}</div>
            <h1 class="profile-name">{{name}}</h1>
            <div class="profile-title">{{title}}</div>
            <div class="profile-organization">{{organization}}</div>
            <div class="views-counter">
                <i class="fas fa-eye" style="margin-right: 6px;"></i>
                {{views}} views
            </div>
        </div>

        <div class="contact-section">
            {{#if phone}}
            <a href="tel:{{phone}}" class="contact-item" onclick="trackContact('phone')">
                <div class="contact-icon"><i class="fas fa-phone"></i></div>
                <div class="contact-info">
                    <div class="contact-label">Phone</div>
                    <div class="contact-value">{{phone}}</div>
                </div>
            </a>
            {{/if}}

            {{#if mobile}}
            <a href="tel:{{mobile}}" class="contact-item" onclick="trackContact('mobile')">
                <div class="contact-icon"><i class="fas fa-mobile-alt"></i></div>
                <div class="contact-info">
                    <div class="contact-label">Mobile</div>
                    <div class="contact-value">{{mobile}}</div>
                </div>
            </a>
            {{/if}}

            {{#if email}}
            <a href="mailto:{{email}}" class="contact-item" onclick="trackContact('email')">
                <div class="contact-icon"><i class="fas fa-envelope"></i></div>
                <div class="contact-info">
                    <div class="contact-label">Email</div>
                    <div class="contact-value">{{email}}</div>
                </div>
            </a>
            {{/if}}

            {{#if website}}
            <a href="{{website}}" target="_blank" class="contact-item" onclick="trackContact('website')">
                <div class="contact-icon"><i class="fas fa-globe"></i></div>
                <div class="contact-info">
                    <div class="contact-label">Website</div>
                    <div class="contact-value">{{website}}</div>
                </div>
            </a>
            {{/if}}
        </div>

        {{#if hasSocialMedia}}
              <div class="social-section">
                <h3 class="section-title">Connect With Me</h3>
                <div class="social-links">
                    {{#each socialMedia}}
                    {{#if this}}
                    <a href="{{this}}" target="_blank" class="social-link" onclick="trackSocial('{{@key}}')">
                        <i class="{{socialIcon @key}}" style="font-size: 24px; margin-bottom: 8px;"></i>
                        <span style="font-size: 0.8rem; font-weight: 600;">{{capitalizeFirst @key}}</span>
                    </a>
                    {{/if}}
                    {{/each}}
                </div>
              </div>
          {{/if}}

          {{#if address}}
              <div class="address-section">
                  <h3 class="section-title">
                      <i class="fas fa-map-marker-alt" style="margin-right: 8px; color: #764ba2;"></i>
                      Location
                  </h3>
                  <div style="font-size: 1rem; line-height: 1.6; color: #4a5568;">{{address}}</div>
              </div>
        {{/if}}

        {{#if notes}}
        <div class="notes-section">
            <h3 class="section-title">
                <i class="fas fa-sticky-note" style="margin-right: 8px; color: #f5576c;"></i>
                About
            </h3>
            <div style="font-size: 1rem; line-height: 1.6; color: #4a5568; font-style: italic;">{{notes}}</div>
        </div>
        {{/if}}

        <div class="actions-section">
            <a href="/api/card/{{cardId}}/vcard" class="action-btn btn-primary">
                <i class="fas fa-download" style="margin-right: 8px;"></i>
                Save Contact
            </a>
        </div>
    </div>

    <script>
        function trackContact(action) {
            fetch(\`/api/card/{{cardId}}/track/contact/\${action}\`, { method: 'POST' }).catch(() => {});
        }
        function trackSocial(platform) {
            fetch(\`/api/card/{{cardId}}/track/\${platform}\`, { method: 'POST' }).catch(() => {});
        }
    </script>
</body>
</html>`;
}



// ============ SHORT URL ROUTES ============

// 1. Create/Get short URL for a profile
router.post('/shorten', async (req, res) => {
  try {
    const { profileId, slug } = req.body;

    if (!profileId && !slug) {
      return res.status(400).json({
        success: false,
        message: 'profileId or slug is required'
      });
    }

    let profile;
    if (profileId) {
      profile = await Profile.findById(profileId);
    } else {
      profile = await Profile.findOne({ slug });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    let shortUrl = await ShortUrl.findOne({ profileId: profile._id });

    if (shortUrl) {
      return res.json({
        success: true,
        shortUrl: `${process.env.BASE_URL}/s/${shortUrl.shortCode}`,
        shortCode: shortUrl.shortCode,
        originalUrl: shortUrl.originalUrl,
        clicks: shortUrl.clicks
      });
    }

    let shortCode;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      shortCode = generateShortCode(6);
      const existing = await ShortUrl.findOne({ shortCode });
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate unique short code'
      });
    }

    const originalUrl = `${process.env.BASE_URL}/card/${profile.slug}`;
    
    shortUrl = await ShortUrl.create({
      shortCode,
      profileId: profile._id,
      originalUrl,
      slug: profile.slug
    });

    res.json({
      success: true,
      shortUrl: `${process.env.BASE_URL}/s/${shortCode}`,
      shortCode,
      originalUrl,
      clicks: 0
    });

  } catch (error) {
    console.error('URL shortening error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating short URL',
      error: error.message
    });
  }
});

// 2. Redirect short URL to profile
router.get('/s/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    const shortUrl = await ShortUrl.findOne({ shortCode });

    if (!shortUrl) {
      return res.status(404).send('Short URL not found');
    }

    if (shortUrl.expiresAt && shortUrl.expiresAt < new Date()) {
      return res.status(410).send('This short URL has expired');
    }

    shortUrl.clicks += 1;
    await shortUrl.save();

    // Optional: Track analytics
    if (Analytics) {
      // await Analytics.create({
      //   profileId: shortUrl.profileId,
      //   event: 'short_url_click',
      //   eventData: {
      //     shortCode,
      //     originalUrl: shortUrl.originalUrl
      //   },
      //   ip: req.ip,
      //   userAgent: req.get('User-Agent')
      // });

      await AnalyticsHelper.trackEvent(
        profile._id, 
        'view', 
        {
          ref: req.query.ref || 'direct',
          cardId: profile.cardId,
          method: 'public_access',
          accessedVia: identifier === profile.slug ? 'slug' : 'cardId'
        }, 
        req
      );
    }

    res.redirect(301, `/card/${shortUrl.slug}`);

  } catch (error) {
    console.error('Short URL redirect error:', error);
    res.status(500).send('Error processing short URL');
  }
});

// 3. Get short URL info
router.get('/s/:shortCode/info', async (req, res) => {
  try {
    const { shortCode } = req.params;

    const shortUrl = await ShortUrl.findOne({ shortCode })
      .populate('profileId', 'name slug title organization');

    if (!shortUrl) {
      return res.status(404).json({
        success: false,
        message: 'Short URL not found'
      });
    }

    res.json({
      success: true,
      shortCode: shortUrl.shortCode,
      shortUrl: `${process.env.BASE_URL}/s/${shortUrl.shortCode}`,
      originalUrl: shortUrl.originalUrl,
      profile: shortUrl.profileId,
      clicks: shortUrl.clicks,
      createdAt: shortUrl.createdAt,
      expiresAt: shortUrl.expiresAt
    });

  } catch (error) {
    console.error('Short URL info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching short URL info'
    });
  }
});

// 4. Get short URL for current profile
router.get('/:identifier/short-url', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const profile = await findProfileBySlugOrCardId(identifier);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    const shortUrl = await profile.getOrCreateShortUrl();

    res.json({
      success: true,
      shortUrl,
      originalUrl: `${process.env.BASE_URL}/card/${profile.slug}`,
      profile: {
        name: profile.name,
        slug: profile.slug
      }
    });

  } catch (error) {
    console.error('Get short URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting short URL'
    });
  }
});

// 5. Bulk generate short URLs (admin only)
router.post('/admin/generate-short-urls', async (req, res) => {
  try {
    const profiles = await Profile.find({});
    const results = [];

    for (const profile of profiles) {
      try {
        const shortUrl = await profile.getOrCreateShortUrl();
        results.push({
          profileId: profile._id,
          name: profile.name,
          slug: profile.slug,
          shortUrl
        });
      } catch (error) {
        console.error(`Error generating short URL for ${profile.name}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Generated ${results.length} short URLs`,
      results
    });

  } catch (error) {
    console.error('Bulk short URL generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating short URLs'
    });
  }
});

module.exports = router;



