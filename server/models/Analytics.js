// models/Analytics.js
const mongoose = require('mongoose');

// const analyticsSchema = new mongoose.Schema({
//   profileId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Profile',
//     required: true,
//     index: true
//   },
//   event: {
//     type: String,
//     enum: ['view', 'download', 'share', 'contact_click', 'social_click','short_url_click'],
//     required: true
//   },
//   eventData: {
//     type: mongoose.Schema.Types.Mixed,
//     default: {}
//   },
//   userAgent: String,
//   // ip: String,
//   ip: {
//     type: String,
//     index: true
//   },
//   // Location Data
//   location: {
//     country: String,
//     countryCode: String,
//     region: String,
//     regionName: String,
//     city: String,
//     zip: String,
//     lat: Number,
//     lon: Number,
//     timezone: String,
//     isp: String,
//     org: String
//   },
  
//   // Device Information
//   device: {
//     type: String, // 'mobile', 'tablet', 'desktop'
//     browser: String,
//     browserVersion: String,
//     os: String,
//     osVersion: String,
//     platform: String,
//     isMobile: Boolean,
//     isTablet: Boolean,
//     isDesktop: Boolean
//   },
  
//   userAgent: String,
//   referrer: String,
  
//   createdAt: {
//     type: Date,
//     default: Date.now,
//     index: true
//   },
//   country: String,
//   city: String,
//   referrer: String,
//   timestamp: {
//     type: Date,
//     default: Date.now,
//     index: true
//   }
// });

const analyticsSchema = new mongoose.Schema({
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
    index: true
  },
  event: {
    type: String,
    enum: ['view', 'download', 'share', 'contact_click', 'social_click', 'short_url_click', 'vcard_download', 'wallet_pass_download', 'profile_view', 'contact_save', 'qr_scan'],
    required: true
  },
  eventData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip: {
    type: String,
    index: true
  },
  
  // Location Data
  location: {
    country: String,
    countryCode: String,
    region: String,
    regionName: String,
    city: String,
    zip: String,
    lat: Number,
    lon: Number,
    timezone: String,
    isp: String,
    org: String
  },
  
  // Device Information (FIXED - removed 'type: String')
  device: {
    deviceType: String, // 'mobile', 'tablet', 'desktop'
    browser: String,
    browserVersion: String,
    os: String,
    osVersion: String,
    platform: String,
    isMobile: Boolean,
    isTablet: Boolean,
    isDesktop: Boolean
  },
  
  userAgent: String,
  referrer: String,
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes
analyticsSchema.index({ profileId: 1, createdAt: -1 });
analyticsSchema.index({ ip: 1, createdAt: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);
module.exports = Analytics;

analyticsSchema.index({ profileId: 1, createdAt: -1 });
analyticsSchema.index({ ip: 1, createdAt: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema, 'analyticsdata');