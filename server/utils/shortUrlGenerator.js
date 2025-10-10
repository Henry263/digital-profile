// Utility functions for generating short codes

function generateShortCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  function generateReadableShortCode(profile) {
    const name = profile.name.toLowerCase().replace(/\s+/g, '');
    const random = Math.random().toString(36).substring(2, 5);
    return `${name.substring(0, 3)}${random}`;
  }
  
  module.exports = {
    generateShortCode,
    generateReadableShortCode
  };