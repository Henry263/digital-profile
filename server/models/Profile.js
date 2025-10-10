// models/Profile.js
const mongoose = require('mongoose');
const multer = require('multer');

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
    required: true,
    unique: true,
    index: true
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
    trim: true
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

function getsixdigitcode(){
  const uniqueCode = Math.random().toString(36).substring(2, 8).toLowerCase();
  return uniqueCode;
}
profileSchema.methods.generateSlug = async function (name) {
  if (!name) return null;

  // Generate base slug
  let baseSlug = name.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  if (!baseSlug) return null;

  const Profile = this.constructor;
  let slug = baseSlug;

  // Check if slug exists
  const existing = await Profile.findOne({ 
    slug: slug,
    _id: { $ne: this._id }
  });

  if (existing) {
    // Slug exists, add 6-character unique code
    const uniqueCode = getsixdigitcode()
    slug = `${baseSlug}-${uniqueCode}`;
    
    // Double-check the new slug is unique
    const existingWithCode = await Profile.findOne({ 
      slug: slug,
      _id: { $ne: this._id }
    });
    
    if (existingWithCode) {
      // Very rare collision, use timestamp
      let reuniqueCode = getsixdigitcode()
      slug = `${baseSlug}-${reuniqueCode}`;
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
profileSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('name')) {
    let baseSlug = await this.generateSlug(this.name);

    if (baseSlug) {
      let slug = baseSlug;
      let counter = 1;

      // Check for uniqueness and add number if needed
      while (await this.constructor.findOne({ slug: slug, _id: { $ne: this._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      this.slug = slug;
    }
  }
  next();
});

// Generate unique cardId before saving
profileSchema.pre('save', function (next) {
  if (!this.cardId) {
    this.cardId = uuidv4();
  }
  this.updatedAt = Date.now();
  next();
});

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
