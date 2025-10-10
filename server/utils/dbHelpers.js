// utils/dbHelpers.js
const mongoose = require('mongoose');

/**
 * Safely converts a string ID to ObjectId for MongoDB queries
 * @param {string|ObjectId} id - The ID to convert
 * @returns {ObjectId} - MongoDB ObjectId
 */
function toObjectId(id) {
  if (!id) return null;
  
  // If it's already an ObjectId, return as-is
  if (mongoose.Types.ObjectId.isValid(id) && typeof id === 'object') {
    return id;
  }
  
  // If it's a valid string, convert to ObjectId
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  
  throw new Error(`Invalid ObjectId: ${id}`);
}

module.exports = { toObjectId };