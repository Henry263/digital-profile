
// utils/qrValidation.js - QR Code validation utilities
const fs = require('fs').promises;
const QRCode = require('qrcode');

const sharedfunctions = require('../services/sharedfunctions')
let envVariables = sharedfunctions.readenvironmentconfig();
const baseURL = envVariables.BASE_URL;

class QRValidation {
  // Validate if uploaded file is a valid QR code
  static async validateQRCodeFile(filePath) {
    try {
      // Check if file exists and is readable
      await fs.access(filePath);
      
      // Check file size (should be reasonable)
      const stats = await fs.stat(filePath);
      if (stats.size > 5 * 1024 * 1024) { // 5MB max
        throw new Error('QR code file too large');
      }
      
      if (stats.size < 1024) { // 1KB minimum
        throw new Error('QR code file too small');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Invalid QR code file: ${error.message}`);
    }
  }

  // Validate QR code URL
  static validateQRUrl(url) {
    try {
      const parsedUrl = new URL(url);
      
      // Check if URL is from our domain
      const allowedHosts = [
        baseURL?.replace(/https?:\/\//, ''),
        'localhost:3000',
        'localhost'
      ].filter(Boolean);
      
      if (!allowedHosts.includes(parsedUrl.host)) {
        throw new Error('QR code URL must point to our domain');
      }
      
      // Check if URL is a valid card URL
      const cardPathRegex = /^\/card\/[a-f0-9-]{36}$/i;
      if (!cardPathRegex.test(parsedUrl.pathname)) {
        throw new Error('QR code URL must be a valid card URL');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Invalid QR URL: ${error.message}`);
    }
  }

  // Generate test QR code to validate generation
  static async testQRGeneration(data = 'test', options = {}) {
    try {
      const testOptions = {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        ...options
      };
      
      const qrBuffer = await QRCode.toBuffer(data, testOptions);
      return {
        success: true,
        size: qrBuffer.length,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = QRValidation;
