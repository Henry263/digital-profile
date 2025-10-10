
// utils/analytics.js
const Analytics = require('../models/Analytics');
const geoip = require('geoip-lite'); // npm install geoip-lite

// ============================================
// 3. UTILITY FUNCTIONS
// ============================================
// utils/analyticsHelper.js

const axios = require('axios');
const UAParser = require('ua-parser-js');

// class AnalyticsHelper {
//   static async trackEvent(profileId, event, eventData = {}, req) {
//     try {
//       const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
//       const userAgent = req.get('User-Agent') || '';
//       const referrer = req.get('Referrer') || '';
      
//       // Get geo information
//       const geo = geoip.lookup(clientIp) || {};
      
//       const analyticsData = {
//         profileId,
//         event,
//         eventData,
//         userAgent,
//         ip: clientIp,
//         country: geo.country || '',
//         city: geo.city || '',
//         referrer
//       };

//       await Analytics.create(analyticsData);
      
//       return true;
//     } catch (error) {
//       console.error('Analytics tracking error:', error);
//       return false;
//     }
//   }

//   static async getProfileStats(profileId, days = 30) {
//     try {
//       const startDate = new Date();
//       startDate.setDate(startDate.getDate() - days);

//       const stats = await Analytics.aggregate([
//         {
//           $match: {
//             profileId: profileId,
//             timestamp: { $gte: startDate }
//           }
//         },
//         {
//           $group: {
//             _id: '$event',
//             count: { $sum: 1 },
//             uniqueIps: { $addToSet: '$ip' }
//           }
//         },
//         {
//           $project: {
//             event: '$_id',
//             count: 1,
//             uniqueCount: { $size: '$uniqueIps' }
//           }
//         }
//       ]);

//       const dailyStats = await Analytics.aggregate([
//         {
//           $match: {
//             profileId: profileId,
//             timestamp: { $gte: startDate }
//           }
//         },
//         {
//           $group: {
//             _id: {
//               date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
//               event: '$event'
//             },
//             count: { $sum: 1 }
//           }
//         },
//         {
//           $group: {
//             _id: '$_id.date',
//             events: {
//               $push: {
//                 event: '$_id.event',
//                 count: '$count'
//               }
//             }
//           }
//         },
//         {
//           $sort: { '_id': 1 }
//         }
//       ]);

//       return {
//         eventStats: stats,
//         dailyStats,
//         period: days
//       };
//     } catch (error) {
//       console.error('Analytics stats error:', error);
//       return null;
//     }
//   }
// }


class AnalyticsHelper {
  
  // Get client IP (handles proxies and load balancers)
  static getClientIP(req) {
    // console.log('Headers:', req.headers['x-forwarded-for']);
    // console.log('Direct IP:', req.connection.remoteAddress);
    // console.log("req.ip: ", req.ip);
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.ip;
  }

  // Get location from IP using ipapi.co
  static async getLocationFromIP(ip) {
    // Handle localhost/private IPs
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return {
        country: 'Local',
        countryCode: 'LOCAL',
        city: 'Localhost',
        region: '',
        regionName: '',
        zip: '',
        lat: 0,
        lon: 0,
        timezone: '',
        isp: 'Local Network',
        org: 'Local Network'
      };
    }

    try {
      // ipapi.co provides 1,000 free requests per day
      // console.log("ip: ", ip);
      const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'qrmypro-analytics/1.0'
        }
      });

      const data = response.data;
      // console.log("Data from API: ", data);
      // Check if we hit rate limit
      if (data.error) {
        console.warn('ipapi.co error:', data.reason);
        return this.getFallbackLocation(ip);
      }

      return {
        country: data.country_name || '',
        countryCode: data.country_code || '',
        region: data.region_code || '',
        regionName: data.region || '',
        city: data.city || '',
        zip: data.postal || '',
        lat: data.latitude || 0,
        lon: data.longitude || 0,
        timezone: data.timezone || '',
        isp: data.org || '',
        org: data.org || ''
      };

    } catch (error) {
      console.error('ipapi.co lookup failed:', error.message);
      return this.getFallbackLocation(ip);
    }
  }

  // Fallback to geoip-lite if ipapi.co fails
  static getFallbackLocation(ip) {
    const location = geoip.lookup(ip);
    
    if (location) {
      return {
        country: location.country,
        countryCode: location.country,
        region: location.region,
        regionName: location.region,
        city: location.city,
        zip: '',
        lat: location.ll?.[0] || 0,
        lon: location.ll?.[1] || 0,
        timezone: location.timezone,
        isp: '',
        org: ''
      };
    }

    return null;
  }

  // Parse device information from User-Agent
  static parseDeviceInfo(userAgent) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    let deviceType = 'desktop';
    if (result.device.type === 'mobile') {
      deviceType = 'mobile';
    } else if (result.device.type === 'tablet') {
      deviceType = 'tablet';
    }

    return {
      deviceType: deviceType,
      browser: result.browser.name || 'Unknown',
      browserVersion: result.browser.version || '',
      os: result.os.name || 'Unknown',
      osVersion: result.os.version || '',
      platform: result.device.vendor || result.os.name || 'Unknown',
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop'
    };
  }

  // Main tracking function with enhanced data
  static async trackEvent(profileId, event, eventData = {}, req) {
    try {
      // console.log("inside trackevent: ", req.get('User-Agent'));
      const ip = this.getClientIP(req);
      const userAgent = req.get('User-Agent') || '';
      const referrer = req.get('Referrer') || req.get('Referer') || '';
      
      // Get location data from ipapi.co
      const location = await this.getLocationFromIP(ip);
      
      // Parse device information
      const device = this.parseDeviceInfo(userAgent);
      
      const analyticsData = {
        profileId,
        event,
        eventData,
        ip,
        location,
        device,
        userAgent,
        referrer
      };

      await Analytics.create(analyticsData);
      
      return true;
    } catch (error) {
      console.error('Analytics tracking error:', error);
      return false;
    }
  }

  // Get profile statistics with device and location breakdown
  static async getProfileStats(profileId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Event statistics
      const eventStats = await Analytics.aggregate([
        {
          $match: {
            profileId: profileId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$event',
            count: { $sum: 1 },
            uniqueIps: { $addToSet: '$ip' }
          }
        },
        {
          $project: {
            event: '$_id',
            count: 1,
            uniqueCount: { $size: '$uniqueIps' }
          }
        }
      ]);

      // Device breakdown
      const deviceStats = await Analytics.aggregate([
        {
          $match: {
            profileId: profileId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$device.type',
            count: { $sum: 1 }
          }
        }
      ]);

      // Location breakdown (top 10 countries)
      const locationStats = await Analytics.aggregate([
        {
          $match: {
            profileId: profileId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$location.country',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        }
      ]);

      // Browser breakdown
      const browserStats = await Analytics.aggregate([
        {
          $match: {
            profileId: profileId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$device.browser',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      // Daily statistics
      const dailyStats = await Analytics.aggregate([
        {
          $match: {
            profileId: profileId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              event: '$event'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            events: {
              $push: {
                event: '$_id.event',
                count: '$count'
              }
            },
            total: { $sum: '$count' }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      return {
        eventStats,
        deviceStats,
        locationStats,
        browserStats,
        dailyStats,
        period: days
      };
    } catch (error) {
      console.error('Analytics stats error:', error);
      return null;
    }
  }

  // Get recent activity with full details
  static async getRecentActivity(profileId, limit = 50) {
    try {
      const activity = await Analytics.find({ profileId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('event ip location device userAgent referrer createdAt');

      return activity;
    } catch (error) {
      console.error('Recent activity error:', error);
      return [];
    }
  }
}
module.exports = AnalyticsHelper;