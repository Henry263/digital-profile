const mongoose = require('mongoose');

const ShortUrlSchema = new mongoose.Schema({
  shortCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  originalUrl: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true
  },
  clicks: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null
  }
});

const ShortUrl = mongoose.model('ShortUrl', ShortUrlSchema, 'shorturls');

module.exports = ShortUrl;