const express = require('express');
const router = express.Router();
const ShortUrl = require('../models/ShortUrl');
const Analytics = require('../models/Analytics');

// Handle short URL redirects
router.get('/s/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    console.log("shortCode: ",shortCode);
    const shortUrl = await ShortUrl.findOne({ shortCode });
    console.log("shortUrl: ",shortUrl);
    if (!shortUrl) {
      return res.status(404).send('Short URL not found');
    }

    if (shortUrl.expiresAt && shortUrl.expiresAt < new Date()) {
      return res.status(410).send('This short URL has expired');
    }

    shortUrl.clicks += 1;
    await shortUrl.save();

    // Track analytics
    if (Analytics) {
      await Analytics.create({
        profileId: shortUrl.profileId,
        event: 'short_url_click',
        eventData: {
          shortCode,
          originalUrl: shortUrl.originalUrl
        },
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    res.redirect(301, `/card/${shortUrl.slug}`);

  } catch (error) {
    console.error('Short URL redirect error:', error);
    res.status(500).send('Error processing short URL');
  }
});

// Get short URL info
router.get('/s/:shortCode/info', async (req, res) => {
  try {
    const { shortCode } = req.params;

    const shortUrl = await ShortUrl.findOne({ shortCode })
      .populate('profileId', 'name slug title organization');

    if (!shortUrl) {
      return res.status(404).json({
        success: false,
        message: 'Short URL not found'
      });
    }

    res.json({
      success: true,
      shortCode: shortUrl.shortCode,
      shortUrl: `${process.env.BASE_URL}/s/${shortUrl.shortCode}`,
      originalUrl: shortUrl.originalUrl,
      profile: shortUrl.profileId,
      clicks: shortUrl.clicks,
      createdAt: shortUrl.createdAt
    });

  } catch (error) {
    console.error('Short URL info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching short URL info'
    });
  }
});

module.exports = router;