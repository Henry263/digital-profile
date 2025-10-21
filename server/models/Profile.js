// models/Profile.js
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcryptjs'); 

const sharedfunctions = require('../services/sharedfunctions')
let envVariables = sharedfunctions.readenvironmentconfig();
const ShortUrl = require('./ShortUrl');

const { v4: uuidv4 } = require('uuid');

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const socialMediaSchema = new mongoose.Schema({
  instagram: { type: String, default: '' },
  facebook: { type: String, default: '' },
  twitter: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  calendly: { type: String, default: '' },
  zoom: { type: String, default: '' },
  snapchat: { type: String, default: '' },
  tiktok: { type: String, default: '' },
  youtube: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  reddit: { type: String, default: '' },
  telegram: { type: String, default: '' },
  pinterest:{ type: String, default: '' }
});


const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    unique: true,
    index: true
  },
  googleId: {
    type: String,
    sparse: true,
    index: true
  },
  password: {
    type: String,
    select: false
  },
  authProvider: {
    type: String,
    enum: ['google', 'email'],
    default: 'email'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    default: null  // ✅ Explicit default
  },
  verificationCodeExpires: {
    type: Date,
    default: null  // ✅ Explicit default
  },
  resetPasswordToken: {
    type: String,
    select: false,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    select: false,
    default: null
  },
  cardId: {
    type: String,
    unique: true,
    default: uuidv4,
    index: true
  },
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    default: '',
    trim: true
  },
  organization: {
    type: String,
    default: '',
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  mobile: {
    type: String,
    default: '',
    trim: true
  },
  // Add this new field
  showPhoneNumber: {
    type: Boolean,
    default: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    index: true
  },
  website: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    type: String,
    default: '',
    trim: true
  },
  
  // Location fields
  country: {
    name: {
      type: String,
      default: '',
      trim: true
    },
    code: {
      type: String,
      default: '',
      trim: true
    }
  },
  state: {
    name: {
      type: String,
      default: '',
      trim: true
    },
    id: {
      type: String,
      default: ''
    },
    code: {  // Add state code field
      type: String,
      default: '',
      trim: true
    }
  },
  city: {
    name: {
      type: String,
      default: '',
      trim: true
    },
    id: {
      type: String,
      default: ''
    }
  },
  
  notes: {
    type: String,
    default: '',
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  // Social Media Links
  socialMedia: {
    type: socialMediaSchema,
    _id: false,
    default: () => ({})
  },
  qrCodes: [{
    type: {
      type: String,
      enum: ['standard', 'large', 'small', 'colored', 'high-contrast', 'custom', 'branded'],
      required: true
    },
    data: String,
    url: String,
    size: Number,
    format: String,
    generatedAt: Date
  }],
  primaryQR: mongoose.Schema.Types.ObjectId,
  uploadedQR: {
    url: { type: String, default: '' },
    filename: { type: String, default: '' }
  },
  profileImage: {
    url: { type: String, default: '' },
    filename: { type: String, default: '' }
  },
  // Settings
  isPublic: {
    type: Boolean,
    default: true
  },
  theme: {
    type: String,
    enum: ['default', 'dark', 'blue', 'green', 'purple'],
    default: 'default'
  },
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  lastViewed: {
    type: Date
  },
  // URLs
  standaloneUrl: {
    type: String,
    default: function () {
      return `/card/${this.cardId}`;
    }
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
    data: {
      type: Buffer,
      required: false
    },
    contentType: {
      type: String,
      required: false
    },
    size: {
      type: Number,
      required: false
    }
  },
}, {
  timestamps: true
});

// ============== AUTH METHODS ==============

// Hash password before saving
// profileSchema.pre('save', async function(next) {
//   // Only hash password if it's modified and exists
//   if (!this.isModified('password') || !this.password) {
//     return next();
//   }
  
//   try {
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// ============== SINGLE COMBINED PRE-SAVE HOOK ==============
// Replace ALL pre('save') hooks with this one
profileSchema.pre('save', async function(next) {
  try {
    // 1. Update timestamp
    this.updatedAt = Date.now();
    
    // 2. Generate cardId if not exists
    if (!this.cardId) {
      this.cardId = uuidv4();
    }
    
    // 3. Generate slug for NEW profiles only
    if (this.isNew && !this.slug) {
      const generatedSlug = await this.generateSlug(this.name);
      if (generatedSlug) {
        this.slug = generatedSlug;
      }
    }
    
    // 4. Hash password only if modified and exists
    // if (this.isModified('password') && this.password) {
    //   const salt = await bcrypt.genSalt(12);
    //   this.password = await bcrypt.hash(this.password, salt);
    // }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
profileSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Need to get password field explicitly since select: false
    const profile = await this.constructor.findById(this._id).select('+password');
    if (!profile || !profile.password) {
      return false;
    }
    return await bcrypt.compare(candidatePassword, profile.password);
  } catch (error) {
    console.error('Password compare error:', error);
    return false;
  }
};

// Method to generate verification code
profileSchema.methods.generateVerificationCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = code;
  this.verificationCodeExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

  this.markModified('verificationCode');
  this.markModified('verificationCodeExpires');

  return code;
};

// Method to generate password reset token
profileSchema.methods.generateResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpires = Date.now() + 30 * 60 * 60 * 1000; // 30 minutes

  this.markModified('resetPasswordToken');
  this.markModified('resetPasswordExpires');

  return token;
};


function getsixdigitcode(){
  const uniqueCode = Math.random().toString(36).substring(2, 8).toLowerCase();
  return uniqueCode;
}

// Helper function to interweave/mix name and unique code
function mixNameAndCode(name, code) {
  // Remove spaces and special characters from name
  const cleanName = name.toLowerCase()
    .replace(/[^\w]/g, '')  // Keep only alphanumeric
    .replace(/\s+/g, '');    // Remove spaces
  
  let result = '';
  const maxLength = Math.max(cleanName.length, code.length);
  
  // Interweave characters from name and code alternately
  for (let i = 0; i < maxLength; i++) {
    if (i < cleanName.length) {
      result += cleanName[i];
    }
    if (i < code.length) {
      result += code[i];
    }
  }
  
  return result;
}
profileSchema.methods.generateSlug = async function (name) {
  if (!name) return null;

  // // Generate base slug
  // let baseSlug = name.toLowerCase()
  //   .replace(/[^\w\s-]/g, '')
  //   .replace(/[\s_]+/g, '-')
  //   .replace(/-{2,}/g, '-')
  //   .replace(/^-|-$/g, '');

  // if (!baseSlug) return null;

  
  const uniqueCode = getsixdigitcode();
  
  // Mix name and code together (interweave)
  let slug = mixNameAndCode(name, uniqueCode);

  const Profile = this.constructor;
  // Check if slug exists
  const existing = await Profile.findOne({ 
    slug: slug,
    _id: { $ne: this._id }
  });

  if (existing) {
    // Slug exists, add 6-character unique code
    const uniqueCode = getsixdigitcode()
    slug = mixNameAndCode(name, uniqueCode);
    
    // Double-check the new slug is unique
    const existingWithCode = await Profile.findOne({ 
      slug: slug,
      _id: { $ne: this._id }
    });
    
    if (existingWithCode) {
      // Very rare collision, use timestamp
      let reuniqueCode = getsixdigitcode()
      slug = mixNameAndCode(name, reuniqueCode);
    }
  }

  return slug;
};


// Method to get initials for avatar
profileSchema.methods.hasProfilePhoto = function() {
  return !!(this.profilePhoto && this.profilePhoto.data && this.profilePhoto.data.length > 0);
};

profileSchema.methods.getInitials = function() {
  if (!this.name) return 'U';
  const names = this.name.trim().split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return this.name.substring(0, 2).toUpperCase();
};

// Pre-save hook to generate slug
// profileSchema.pre('save', async function (next) {
  
//   // Only generate slug for NEW profiles, never change existing slugs
//   if (this.isNew && !this.slug) {  // ✅ ONLY on creation
//     const generatedSlug = await this.generateSlug(this.name);
//     if (generatedSlug) {
//       this.slug = generatedSlug;
//     }
//   }
//   // If name is modified on existing profile, slug remains unchanged
//   next();
// });

// Generate unique cardId before saving
// profileSchema.pre('save', function (next) {
//   if (!this.cardId) {
//     this.cardId = uuidv4();
//   }
//   this.updatedAt = Date.now();
//   next();
// });



// Generate standalone URL
profileSchema.methods.generateStandaloneUrl = function () {
  //return `${process.env.BASE_URL}/api/card/${this.cardId}`;
  const identifier = this.slug || this.cardId;
  // const returnurl = envVariables.BASE_URL+''
  // return `${process.env.BASE_URL}/api/card/${identifier}`;
  return `${envVariables.BASE_URL}/card/${identifier}`;
};

// Generate QR code URL
profileSchema.methods.generateQRUrl = function () {
  const standaloneUrl = this.generateStandaloneUrl();
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(standaloneUrl)}`;
};

// Increment views
profileSchema.methods.incrementViews = function () {
  this.views += 1;
  this.lastViewed = new Date();
  return this.save();
};

// Virtual for card URL
profileSchema.virtual('cardUrl').get(function () {
  return this.generateStandaloneUrl();
});

// Ensure virtual fields are serialized
profileSchema.set('toJSON', { virtuals: true });

profileSchema.methods.getOrCreateShortUrl = async function() {
  const { generateShortCode } = require('../utils/shortUrlGenerator');
  // console.log("this._id ", this._id);
  let shortUrl = await ShortUrl.findOne({ profileId: this._id });
  // console.log("shortUrl", shortUrl);
  if (!shortUrl) {
    let shortCode;
    let attempts = 0;
    
    do {
      shortCode = generateShortCode(6);
      const existing = await ShortUrl.findOne({ shortCode });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    const originalUrl = `${process.env.BASE_URL}/card/${this.slug}`;
    
    shortUrl = await ShortUrl.create({
      shortCode,
      profileId: this._id,
      originalUrl,
      slug: this.slug
    });
  }
  
  return `${process.env.BASE_URL}/s/${shortUrl.shortCode}`;
};

module.exports = mongoose.model('Profile', profileSchema, 'profiles');
