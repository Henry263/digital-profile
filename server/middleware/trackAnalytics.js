const Analytics = require('../models/Analytics');
const { gatherAnalytics } = require('../utils/analyticsHelper');

// Middleware to track profile views
async function trackProfileView(req, res, next) {
  try {
    const profile = req.profile; // Assumes profile is set by previous middleware
    
    if (profile) {
      const analyticsData = await gatherAnalytics(req);
      
      await Analytics.create({
        profileId: profile._id,
        event: 'profile_view',
        eventData: {
          slug: profile.slug,
          cardId: profile.cardId
        },
        ...analyticsData
      });
      
      // Increment profile views
      await profile.incrementViews();
    }
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Don't fail the request if analytics fails
  }
  
  next();
}

module.exports = {
  trackProfileView
};