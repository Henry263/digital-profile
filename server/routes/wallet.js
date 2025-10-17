// server/routes/wallet.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Profile = require('../models/Profile');
const { authenticateToken } = require('./auth');

// Helper function to get userId as ObjectId
function getUserId(user) {
  const userId = user.userId || user._id;
  // Convert to ObjectId if it's a string
  return mongoose.Types.ObjectId.isValid(userId) && typeof userId === 'string'
    ? new mongoose.Types.ObjectId(userId)
    : userId;
}

// Get user's wallet
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req.user);
    
    let wallet = await Wallet.findOne({ userId: userId })
      .populate('cards.profileId', 'name email phone profileImage title organization');
    
    if (!wallet) {
      // Create empty wallet if it doesn't exist
      wallet = new Wallet({
        userId: userId,
       
        cards: []
      });
      await wallet.save();
    }
    
    res.json({
      success: true,
      wallet: wallet
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet'
    });
  }
});

// Add card to wallet
router.post('/add/:cardId', authenticateToken, async (req, res) => {
  try {
    const { cardId } = req.params;
    const userId = getUserId(req.user);
    
    // Find the profile by cardId or slug
    const profile = await Profile.findOne({
      $or: [{ cardId: cardId }, { slug: cardId }]
    });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }
    
    // Find or create wallet
    let wallet = await Wallet.findOne({ userId: userId });
    
    if (!wallet) {
      wallet = new Wallet({
        userId: userId,
        cards: []
      });
    }
    const initials = profile.getInitials ? profile.getInitials() : 
      (profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'NA');
    // Prepare card data - match the schema exactly
    let hasProfilePhoto = !!(profile.profilePhoto && profile.profilePhoto.data && profile.profilePhoto.data.length > 0);
    
    const cardData = {
      profileId: new mongoose.Types.ObjectId(profile._id),
      cardId: profile.cardId,
      name: profile.name,
      email: profile.email,
      phone: profile.phone || '',
      mobile: profile.mobile || '',
      slug: profile.slug || '',
      title: profile.title || '',
      organization: profile.organization || '',
      initials: initials,
      hasProfilePhoto:hasProfilePhoto,
      profileImage: {
        url: profile.profileImage?.url || ''
      },
      qrCodeUrl: `/card/${profile.slug || profile.cardId}/qr`
    };
   
    // Add card to wallet
    const result = wallet.addCard(cardData);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    await wallet.save();
    
    res.json({
      success: true,
      message: 'Card added to wallet successfully',
      wallet: wallet
    });
  } catch (error) {
    console.error('Error adding card to wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add card to wallet'
    });
  }
});

// Remove card from wallet
router.delete('/remove/:cardId', authenticateToken, async (req, res) => {
  try {
    const { cardId } = req.params;
    const userId = getUserId(req.user);
    
    const wallet = await Wallet.findOne({ userId: userId });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    const result = wallet.removeCard(cardId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    await wallet.save();
    
    res.json({
      success: true,
      message: 'Card removed from wallet successfully',
      wallet: wallet
    });
  } catch (error) {
    console.error('Error removing card from wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove card from wallet'
    });
  }
});

// Check if card is in wallet
router.get('/check/:cardId', authenticateToken, async (req, res) => {
  try {
    const { cardId } = req.params;
    const userId = getUserId(req.user);
    
    const wallet = await Wallet.findOne({ userId: userId });
    
    if (!wallet) {
      return res.json({
        success: true,
        inWallet: false
      });
    }
    
    const cardInWallet = wallet.cards.some(card => card.cardId === cardId);
    
    res.json({
      success: true,
      inWallet: cardInWallet
    });
  } catch (error) {
    console.error('Error checking wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wallet'
    });
  }
});

module.exports = router;