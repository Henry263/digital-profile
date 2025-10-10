// utils/qrGenerator.js
const QRCode = require('qrcode');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class QRGenerator {
  static async generateQR(data, options = {}) {
    const defaultOptions = {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    const qrOptions = { ...defaultOptions, ...options };
    
    try {
      const qrCodeBuffer = await QRCode.toBuffer(data, qrOptions);
      return qrCodeBuffer;
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  static async generateCustomQR(data, customOptions = {}) {
    const {
      logo,
      backgroundColor = '#FFFFFF',
      foregroundColor = '#000000',
      width = 400
    } = customOptions;

    try {
      // Generate base QR code
      const qrBuffer = await this.generateQR(data, {
        width,
        margin: 2,
        color: {
          dark: foregroundColor,
          light: backgroundColor
        }
      });

      let finalImage = sharp(qrBuffer);

      // Add logo if provided
      if (logo && await fs.access(logo).then(() => true).catch(() => false)) {
        const logoSize = Math.floor(width * 0.2); // Logo is 20% of QR size
        
        const resizedLogo = await sharp(logo)
          .resize(logoSize, logoSize, { fit: 'contain' })
          .png()
          .toBuffer();

        finalImage = finalImage.composite([{
          input: resizedLogo,
          gravity: 'center'
        }]);
      }

      return await finalImage.png().toBuffer();
    } catch (error) {
      console.error('Custom QR generation error:', error);
      // Fallback to basic QR
      return await this.generateQR(data, { width });
    }
  }

  static async saveQR(buffer, filePath) {
    try {
      await fs.writeFile(filePath, buffer);
      return filePath;
    } catch (error) {
      console.error('QR save error:', error);
      throw new Error('Failed to save QR code');
    }
  }
}

module.exports = QRGenerator;
