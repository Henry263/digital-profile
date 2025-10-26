// server/routes/wallet.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Wallet = require('../models/wallet');
const Profile = require('../models/Profile');
const { authenticateToken } = require('./auth');

// Helper function to get userId as ObjectId
function getUserId(user) {
  const userId = user.userId || user._id;
  return mongoose.Types.ObjectId.isValid(userId) && typeof userId === 'string'
    ? new mongoose.Types.ObjectId(userId)
    : userId;
}

// ============================================
// GET USER'S WALLET - OPTIMIZED VERSION
// ============================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req.user);
    const userEmail = req.user.email;
    
    // console.log(`📦 Fetching wallet for userId: ${userId}, email: ${userEmail}`);
    
    // Use findOneAndUpdate with upsert for atomic operation
    // This prevents race conditions and duplicate key errors
    const wallet = await Wallet.findOneAndUpdate(
      { userId: userId },
      {
        $setOnInsert: {
          userId: userId,
          email: userEmail,  // ✅ Add email on creation
          cards: [],
          createdAt: new Date()
        },
        $set: {
          updatedAt: new Date()
        }
      },
      {
        new: true,           // Return the updated document
        upsert: true,        // Create if doesn't exist
        runValidators: true, // Run schema validators
        setDefaultsOnInsert: true
      }
    ).populate('cards.profileId', 'name email phone profileImage title organization');
    
    // console.log(`✅ Wallet retrieved successfully, cards count: ${wallet.cards.length}`);
    
    const walletObject = wallet.toObject();
    walletObject.cards = walletObject.cards.map(card => {
      const { profileId, ...cardWithoutProfileId } = card;
      return cardWithoutProfileId;
    });

    res.json({
      success: true,
      wallet: walletObject
    });
    
  } catch (error) {
    console.error('❌ Error fetching wallet:', error);
    
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      console.log('⚠️ Duplicate key detected, fetching existing wallet...');
      try {
        const userId = getUserId(req.user);
        const existingWallet = await Wallet.findOne({ userId: userId })
          .populate('cards.profileId', 'name email phone profileImage title organization');
        
        if (existingWallet) {
          // Update email if missing
          if (!existingWallet.email) {
            existingWallet.email = req.user.email;
            await existingWallet.save();
          }
          
          return res.json({
            success: true,
            wallet: existingWallet
          });
        }
      } catch (retryError) {
        console.error('❌ Error on retry:', retryError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// ADD CARD TO WALLET - OPTIMIZED VERSION
// ============================================
router.post('/add/:cardId', authenticateToken, async (req, res) => {
  try {
    const { cardId } = req.params;
    const userId = getUserId(req.user);
    const userEmail = req.user.email;
    
    console.log(`➕ Adding card ${cardId} to wallet for user: ${userEmail}`);
    
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
    
    console.log(`✅ Profile found: ${profile.name}`);
    
    // Get or create wallet atomically
    let wallet = await Wallet.findOneAndUpdate(
      { userId: userId },
      {
        $setOnInsert: {
          userId: userId,
          email: userEmail,  // ✅ Add email on creation
          cards: [],
          createdAt: new Date()
        },
        $set: {
          updatedAt: new Date()
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );
    
    // Update email if missing (for existing wallets)
    if (!wallet.email) {
      wallet.email = userEmail;
    }
    
    // Check if card already exists
    const existingCard = wallet.cards.find(
      card => card.cardId === cardId || 
              card.profileId.toString() === profile._id.toString()
    );
    
    if (existingCard) {
      console.log(`⚠️ Card already exists in wallet`);
      return res.status(400).json({
        success: false,
        message: 'Card already in wallet'
      });
    }
    
    // Prepare card data
    const initials = profile.getInitials ? profile.getInitials() : 
      (profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'NA');
    
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
      hasProfilePhoto: hasProfilePhoto,
      profileImage: {
        url: profile.profileImage?.url || ''
      },
      qrCodeUrl: `/card/${profile.slug || profile.cardId}/qr`,
      addedAt: new Date()
    };
    
    // Add card to wallet
    wallet.cards.push(cardData);
    await wallet.save();
    
    console.log(`✅ Card added successfully, total cards: ${wallet.cards.length}`);
    
    res.json({
      success: true,
      message: 'Card added to wallet successfully',
      wallet: wallet
    });
    
  } catch (error) {
    console.error('❌ Error adding card to wallet:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Wallet operation conflict. Please try again.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to add card to wallet',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// REMOVE CARD FROM WALLET
// ============================================
router.delete('/remove/:cardId', authenticateToken, async (req, res) => {
  try {
    const { cardId } = req.params;
    const userId = getUserId(req.user);
    
    console.log(`🗑️ Removing card ${cardId} from wallet`);
    
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
    
    console.log(`✅ Card removed, remaining cards: ${wallet.cards.length}`);
    
    res.json({
      success: true,
      message: 'Card removed from wallet successfully',
      wallet: wallet
    });
  } catch (error) {
    console.error('❌ Error removing card from wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove card from wallet'
    });
  }
});

// ============================================
// CHECK IF CARD IS IN WALLET
// ============================================
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
    
    const cardInWallet = wallet.cards.some(
      card => card.cardId === cardId || card.slug === cardId
    );
    
    res.json({
      success: true,
      inWallet: cardInWallet
    });
  } catch (error) {
    console.error('❌ Error checking wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wallet'
    });
  }
});

module.exports = router;