const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  provider: {
    type: String,
    default: 'google'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  profilePhoto: {
    data: Buffer,
    contentType: String,
    size: Number
  }
}, {
  timestamps: true
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to get initials for avatar
userSchema.methods.getInitials = function() {
  if (this.name) {
    const names = this.name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  }
  return this.username.substring(0, 2).toUpperCase();
};

// Method to check if user has profile photo
userSchema.methods.hasProfilePhoto = function() {
  return !!(this.profilePhoto && this.profilePhoto.data);
};

module.exports = mongoose.model('User', userSchema, 'userdata');


