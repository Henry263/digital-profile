// services/qrService.js - Fixed for MongoDB storage
const QRCode = require('qrcode');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sharedfunctions = require('../services/sharedfunctions')
let envVariables = sharedfunctions.readenvironmentconfig();
const baseURL = envVariables.BASE_URL;


const { v4: uuidv4 } = require('uuid');

class QRService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads');
    this.qrDir = path.join(this.uploadDir, 'qr-codes');
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.qrDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  // NEW: Generate QR code for MongoDB storage (returns base64 data)
  async generateQRForDB(profile, options = {}) {
    try {
      const {
        size = 400,
        margin = 2,
        darkColor = '#000000',
        lightColor = '#FFFFFF',
        type = 'standard'
      } = options;

      const standaloneUrl = `${baseURL}/card/${profile.cardId}`;
      
      console.log(`🔲 Generating ${type} QR code for MongoDB: ${profile.name} -> ${standaloneUrl}`);

      const qrOptions = {
        width: size,
        margin: margin,
        color: {
          dark: darkColor,
          light: lightColor
        },
        errorCorrectionLevel: 'M'
      };

      // Generate QR code as data URL (base64) for MongoDB storage
      const qrDataURL = await QRCode.toDataURL(standaloneUrl, qrOptions);

      console.log(`✅ Generated ${type} QR code data URL (length: ${qrDataURL.length})`);

      return {
        type: type,
        data: qrDataURL, // Base64 data URL for MongoDB
        url: standaloneUrl,
        size: size,
        format: 'PNG',
        generatedAt: new Date(),
        // Optional: also save as file
        fileInfo: await this.saveQRToFile(qrDataURL, profile, type)
      };

    } catch (error) {
      console.error(`QR generation error for ${type}:`, error);
      throw new Error(`Failed to generate ${type} QR code: ${error.message}`);
    }
  }

  // NEW: Generate multiple QR formats for MongoDB storage
  async generateMultipleFormats(profile) {
    try {
      console.log(`🔲 Generating multiple QR formats for MongoDB: ${profile.name}`);
      const formats = [];

      // Standard QR code (400x400)
      const standard = await this.generateQRForDB(profile, {
        size: 400,
        type: 'standard',
        darkColor: '#000000',
        lightColor: '#FFFFFF'
      });
      formats.push(standard);

      // Small QR code (200x200)
      const small = await this.generateQRForDB(profile, {
        size: 200,
        type: 'small',
        darkColor: '#000000',
        lightColor: '#FFFFFF'
      });
      formats.push(small);

      // Large QR code (600x600)
      const large = await this.generateQRForDB(profile, {
        size: 600,
        type: 'large',
        darkColor: '#000000',
        lightColor: '#FFFFFF'
      });
      formats.push(large);

      // Branded QR code (with theme colors)
      if (profile.theme && profile.theme !== 'default') {
        const brandedColors = this.getThemeColors(profile.theme);
        const branded = await this.generateQRForDB(profile, {
          size: 400,
          type: 'branded',
          darkColor: brandedColors.dark,
          lightColor: brandedColors.light
        });
        formats.push(branded);
      }

      console.log(`✅ Generated ${formats.length} QR formats for MongoDB storage`);
      return formats;

    } catch (error) {
      console.error('Multiple formats generation error:', error);
      throw error;
    }
  }

  // Save QR data URL to file (optional backup)
  async saveQRToFile(dataURL, profile, type) {
    try {
      // Convert data URL to buffer
      const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const filename = `qr-${type}-${profile.cardId}-${Date.now()}.png`;
      const filepath = path.join(this.qrDir, filename);
      
      await fs.writeFile(filepath, buffer);
      
      return {
        filename: filename,
        path: filepath,
        url: `/uploads/qr-codes/${filename}`,
        savedAt: new Date()
      };
    } catch (error) {
      console.error('Error saving QR to file:', error);
      return null;
    }
  }

  // EXISTING: Generate QR code for file storage (keep for backward compatibility)
  async generateProfileQR(profile, options = {}) {
    console.log("File-based QR code generated: ", profile.name);
    try {
      const {
        size = 400,
        margin = 2,
        darkColor = '#000000',
        lightColor = '#FFFFFF',
        logoPath = null,
        customDesign = false
      } = options;

      const standaloneUrl = `${baseURL}/card/${profile.cardId}`;
      
      console.log(`🔲 Generating file-based QR code for: ${profile.name} -> ${standaloneUrl}`);

      const qrOptions = {
        width: size,
        margin: margin,
        color: {
          dark: darkColor,
          light: lightColor
        },
        errorCorrectionLevel: 'M'
      };

      let qrBuffer;

      if (customDesign || logoPath) {
        qrBuffer = await this.generateCustomQR(standaloneUrl, {
          size,
          darkColor,
          lightColor,
          logoPath
        });
      } else {
        qrBuffer = await QRCode.toBuffer(standaloneUrl, qrOptions);
      }

      const qrFileName = `qr-${profile.cardId}-${Date.now()}.png`;
      const qrPath = path.join(this.qrDir, qrFileName);
      
      await fs.writeFile(qrPath, qrBuffer);
      
      console.log(`✅ File-based QR code saved: ${qrFileName}`);

      return {
        filename: qrFileName,
        path: qrPath,
        url: `/uploads/qr-codes/${qrFileName}`,
        standaloneUrl: standaloneUrl,
        size: qrBuffer.length,
        dimensions: `${size}x${size}`,
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('File-based QR generation error:', error);
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  // Generate custom QR code with logo
  async generateCustomQR(data, options = {}) {
    const {
      size = 400,
      darkColor = '#000000',
      lightColor = '#FFFFFF',
      logoPath = null
    } = options;

    try {
      const qrBuffer = await QRCode.toBuffer(data, {
        width: size,
        margin: 2,
        color: {
          dark: darkColor,
          light: lightColor
        }
      });

      let finalImage = sharp(qrBuffer);

      if (logoPath && await this.fileExists(logoPath)) {
        const logoSize = Math.floor(size * 0.15);
        
        const resizedLogo = await sharp(logoPath)
          .resize(logoSize, logoSize, { 
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .png()
          .toBuffer();

        const logoWithBackground = await sharp({
          create: {
            width: logoSize + 10,
            height: logoSize + 10,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        })
        .composite([{
          input: resizedLogo,
          gravity: 'center'
        }])
        .png()
        .toBuffer();

        finalImage = finalImage.composite([{
          input: logoWithBackground,
          gravity: 'center'
        }]);
      }

      return await finalImage.png().toBuffer();
    } catch (error) {
      console.error('Custom QR generation error:', error);
      return await QRCode.toBuffer(data, {
        width: size,
        margin: 2,
        color: { dark: darkColor, light: lightColor }
      });
    }
  }

  // Get theme colors for branded QR codes
  getThemeColors(theme) {
    const themes = {
      blue: { dark: '#667eea', light: '#ffffff' },
      dark: { dark: '#2d3748', light: '#ffffff' },
      green: { dark: '#48bb78', light: '#ffffff' },
      purple: { dark: '#9f7aea', light: '#ffffff' },
      red: { dark: '#e53e3e', light: '#ffffff' },
      orange: { dark: '#dd6b20', light: '#ffffff' }
    };
    return themes[theme] || { dark: '#000000', light: '#ffffff' };
  }

  // NEW: Regenerate QR codes for MongoDB storage
  async regenerateQRCodes(profile) {
    try {
      console.log(`🔄 Regenerating QR codes for MongoDB: ${profile.name}`);
      
      // Generate new QR codes for MongoDB
      const newQRCodes = await this.generateMultipleFormats(profile);
      
      console.log(`✅ Regenerated ${newQRCodes.length} QR code formats for MongoDB`);
      
      return newQRCodes;
    } catch (error) {
      console.error('QR regeneration error:', error);
      throw error;
    }
  }

  // Delete old QR code files
  async deleteOldQRCodes(qrCodes) {
    try {
      for (const qr of qrCodes) {
        if (qr.fileInfo && qr.fileInfo.filename) {
          const filePath = path.join(this.qrDir, qr.fileInfo.filename);
          await fs.unlink(filePath).catch(() => {}); // Ignore errors if file doesn't exist
        }
        // Also handle old format
        if (qr.filename) {
          const filePath = path.join(this.qrDir, qr.filename);
          await fs.unlink(filePath).catch(() => {});
        }
      }
    } catch (error) {
      console.error('Error deleting old QR codes:', error);
    }
  }

  // Utility function to check if file exists
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Generate QR code with analytics tracking for MongoDB
  async generateTrackableQRForDB(profile, trackingParams = {}) {
    try {
      const baseUrl = `${baseURL}/card/${profile.cardId}`;
      const params = new URLSearchParams({
        ref: trackingParams.source || 'qr',
        utm_source: trackingParams.utmSource || 'qr_code',
        utm_medium: trackingParams.utmMedium || 'offline',
        utm_campaign: trackingParams.utmCampaign || 'business_card',
        ...trackingParams.custom
      });

      const trackableUrl = `${baseUrl}?${params.toString()}`;
      
      const qrOptions = {
        width: trackingParams.size || 400,
        margin: 2,
        color: {
          dark: trackingParams.darkColor || '#000000',
          light: trackingParams.lightColor || '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      };

      // Generate as data URL for MongoDB
      const qrDataURL = await QRCode.toDataURL(trackableUrl, qrOptions);
      
      console.log("Generated trackable QR code for MongoDB");

      return {
        type: 'trackable',
        data: qrDataURL,
        url: trackableUrl,
        trackingParams: trackingParams,
        size: trackingParams.size || 400,
        format: 'PNG',
        generatedAt: new Date(),
        // Optional: save to file
        fileInfo: await this.saveQRToFile(qrDataURL, profile, 'trackable')
      };

    } catch (error) {
      console.error('Trackable QR generation error:', error);
      throw error;
    }
  }

  // NEW: Generate single QR for MongoDB (utility method)
  async generateSingleQRForDB(url, options = {}) {
    try {
      const qrOptions = {
        width: options.size || 400,
        margin: options.margin || 2,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        },
        errorCorrectionLevel: options.errorLevel || 'M'
      };

      const qrDataURL = await QRCode.toDataURL(url, qrOptions);

      return {
        type: options.type || 'custom',
        data: qrDataURL,
        url: url,
        size: qrOptions.width,
        format: 'PNG',
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('Single QR generation error:', error);
      throw error;
    }
  }
}

module.exports = new QRService();
