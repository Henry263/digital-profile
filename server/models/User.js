const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: false,
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
// userSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// ============== COMBINED PRE-SAVE HOOK ==============
// Remove all other pre('save') hooks and use only this one
userSchema.pre('save', async function(next) {
    try {
      // 1. Update timestamp
      this.updatedAt = Date.now();
      
      // 2. Hash password only if modified and exists
      if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
      }
      
      next();
    } catch (error) {
      next(error);
    }
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


// Add these methods to User model (after the schema definition)

// Method to generate verification code
userSchema.methods.generateVerificationCode = function() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.verificationCode = code;
    this.verificationCodeExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
      
  // ✅ CRITICAL: Mark these fields as modified so Mongoose saves them
  this.markModified('verificationCode');
  this.markModified('verificationCodeExpires');

    return code;
  };
  
  // Method to generate password reset token
  userSchema.methods.generateResetToken = function() {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    this.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    // ✅ Mark as modified
  this.markModified('resetPasswordToken');
  this.markModified('resetPasswordExpires');
    return token;
  };
  
  // Method to compare passwords
  userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
      const user = await this.constructor.findById(this._id).select('+password');
      if (!user || !user.password) {
        return false;
      }
      return await bcrypt.compare(candidatePassword, user.password);
    } catch (error) {
      console.error('Password compare error:', error);
      return false;
    }
  };

module.exports = mongoose.model('User', userSchema, 'userdata');