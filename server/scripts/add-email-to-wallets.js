// server/scripts/add-email-to-wallets.js
const mongoose = require('mongoose');
const Wallet = require('../models/wallet');
const Profile = require('../models/Profile');
require('dotenv').config();

async function addEmailToWallets() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all wallets without email
    const wallets = await Wallet.find({ 
      $or: [
        { email: { $exists: false } },
        { email: null },
        { email: '' }
      ]
    });
    
    console.log(`📦 Found ${wallets.length} wallets without email`);
    
    for (const wallet of wallets) {
      // Find profile by userId to get email
      const profile = await Profile.findById(wallet.userId);
      
      if (profile && profile.email) {
        wallet.email = profile.email;
        await wallet.save();
        console.log(`✅ Updated wallet for ${profile.email}`);
      } else {
        console.log(`⚠️ Could not find profile for userId: ${wallet.userId}`);
      }
    }
    
    console.log('✅ Migration completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

addEmailToWallets();