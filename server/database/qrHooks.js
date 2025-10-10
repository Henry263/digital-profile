
// database/qrHooks.js - Database hooks for automatic QR management
const QRService = require('../services/qrService');

class QRHooks {
  // Hook to run after profile save
  static async afterProfileSave(profile, isNew, modifiedFields = []) {
    try {
      const fieldsRequiringQRUpdate = [
        'name', 'title', 'organization', 'website', 'theme', 'cardId'
      ];
      
      const needsQRUpdate = isNew || 
        modifiedFields.some(field => fieldsRequiringQRUpdate.includes(field)) ||
        !profile.qrCodes || 
        profile.qrCodes.length === 0;
      
      if (needsQRUpdate && profile.qrSettings?.autoRegenerate !== false) {
        console.log(`🔄 Auto-regenerating QR codes for: ${profile.name}`);
        
        // Delete old QR codes if updating
        if (!isNew && profile.qrCodes && profile.qrCodes.length > 0) {
          await QRService.deleteOldQRCodes(profile.qrCodes);
        }
        
        // Generate new QR codes
        const newQRCodes = await QRService.generateMultipleFormats(profile);
        
        // Update profile without triggering hooks again
        await profile.constructor.findByIdAndUpdate(profile._id, {
          qrCodes: newQRCodes,
          primaryQR: newQRCodes.find(qr => qr.type === 'standard')?._id
        });
        
        console.log(`✅ Auto-generated ${newQRCodes.length} QR codes`);
      }
    } catch (error) {
      console.error('QR hook error:', error);
      // Don't throw error to avoid breaking profile save
    }
  }

  // Hook to run before profile delete
  static async beforeProfileDelete(profile) {
    try {
      console.log(`🗑️ Cleaning up QR codes before deleting: ${profile.name}`);
      
      if (profile.qrCodes && profile.qrCodes.length > 0) {
        await QRService.deleteOldQRCodes(profile.qrCodes);
      }
      
      console.log(`✅ QR codes cleaned up for: ${profile.name}`);
    } catch (error) {
      console.error('QR cleanup hook error:', error);
    }
  }
}

module.exports = QRHooks;