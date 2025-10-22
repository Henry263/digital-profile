// server/models/Wallet.js
const mongoose = require('mongoose');

const walletCardSchema = new mongoose.Schema({
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  cardId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  organization: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ''
  },
  mobile: {
    type: String,
    default: ''
  },
  slug: {
    type: String,
    default: ''
  },
  initials: {           
    type: String,
    default: 'NA'
  },
  hasProfilePhoto: {   
    type: Boolean,
    default: false
  },
  profileImage: {
    url: {
      type: String,
      default: ''
    }
  },
  qrCodeUrl: {
    type: String
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  _id: false
});

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,  // Keep this for one wallet per user
    index: true
  },
  email: {  // ✅ ADD THIS NEW FIELD
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  cards: [walletCardSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});


// Method to add a card to wallet
walletSchema.methods.addCard = function(cardData) {
  // Check if card already exists
  const existingCard = this.cards.find(
    card => card.cardId === cardData.cardId || 
            card.profileId.toString() === cardData.profileId.toString()
  );
  
  if (existingCard) {
    return { success: false, message: 'Card already in wallet' };
  }
  
  this.cards.push(cardData);
  return { success: true, message: 'Card added to wallet' };
};

// Method to remove a card from wallet
walletSchema.methods.removeCard = function(cardId) {
  const initialLength = this.cards.length;
  this.cards = this.cards.filter(card => card.cardId !== cardId);
  
  if (this.cards.length < initialLength) {
    return { success: true, message: 'Card removed from wallet' };
  }
  
  return { success: false, message: 'Card not found in wallet' };
};

module.exports = mongoose.model('Wallet', walletSchema);