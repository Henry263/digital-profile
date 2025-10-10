
// jobs/qrCleanupJob.js - Cleanup old QR files
const fs = require('fs').promises;
const path = require('path');
const Profile = require('../models/Profile');

class QRCleanupJob {
  static async cleanupOrphanedQRFiles() {
    try {
      console.log('🧹 Starting QR file cleanup job...');
      
      const qrDir = path.join(__dirname, '../uploads/qr-codes');
      
      // Get all QR files
      const files = await fs.readdir(qrDir);
      const qrFiles = files.filter(file => file.endsWith('.png'));
      
      // Get all QR codes in database
      const profiles = await Profile.find({}, 'qrCodes uploadedQR');
      const validFilenames = new Set();
      
      profiles.forEach(profile => {
        if (profile.qrCodes) {
          profile.qrCodes.forEach(qr => {
            if (qr.filename) validFilenames.add(qr.filename);
          });
        }
        if (profile.uploadedQR && profile.uploadedQR.filename) {
          validFilenames.add(profile.uploadedQR.filename);
        }
      });
      
      // Delete orphaned files
      let deletedCount = 0;
      for (const file of qrFiles) {
        if (!validFilenames.has(file)) {
          try {
            await fs.unlink(path.join(qrDir, file));
            deletedCount++;
          } catch (error) {
            console.error(`Error deleting file ${file}:`, error);
          }
        }
      }
      
      console.log(`🧹 Cleanup completed. Deleted ${deletedCount} orphaned QR files.`);
      return deletedCount;
    } catch (error) {
      console.error('QR cleanup job error:', error);
      throw error;
    }
  }

  static async cleanupOldQRCodes(daysOld = 30) {
    try {
      console.log(`🧹 Cleaning up QR codes older than ${daysOld} days...`);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      // Find profiles with old QR codes
      const profiles = await Profile.find({
        'qrCodes.generatedAt': { $lt: cutoffDate }
      });
      
      let cleanedCount = 0;
      
      for (const profile of profiles) {
        const oldQRCodes = profile.qrCodes.filter(qr => 
          new Date(qr.generatedAt) < cutoffDate
        );
        
        if (oldQRCodes.length > 0) {
          // Delete old QR files
          for (const qr of oldQRCodes) {
            try {
              const filePath = path.join(__dirname, '../uploads/qr-codes', qr.filename);
              await fs.unlink(filePath);
            } catch (error) {
              console.error(`Error deleting QR file ${qr.filename}:`, error);
            }
          }
          
          // Remove old QR codes from profile
          profile.qrCodes = profile.qrCodes.filter(qr => 
            new Date(qr.generatedAt) >= cutoffDate
          );
          
          // Regenerate QR codes if none left
          if (profile.qrCodes.length === 0) {
            const QRService = require('../services/qrService');
            const newQRCodes = await QRService.generateMultipleFormats(profile);
            profile.qrCodes = newQRCodes;
            profile.primaryQR = newQRCodes.find(qr => qr.type === 'standard')?._id;
          }
          
          await profile.save();
          cleanedCount++;
        }
      }
      
      console.log(`🧹 Cleaned up old QR codes for ${cleanedCount} profiles.`);
      return cleanedCount;
    } catch (error) {
      console.error('Old QR cleanup error:', error);
      throw error;
    }
  }

  // Schedule cleanup jobs
  static scheduleCleanupJobs() {
    // Run cleanup every 24 hours
    setInterval(async () => {
      try {
        await this.cleanupOrphanedQRFiles();
        await this.cleanupOldQRCodes(30); // Clean QR codes older than 30 days
      } catch (error) {
        console.error('Scheduled cleanup error:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    console.log('📅 QR cleanup jobs scheduled');
  }
}

module.exports = QRCleanupJob;
