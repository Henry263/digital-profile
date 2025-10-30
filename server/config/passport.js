
// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Profile = require('../models/Profile'); // ✅ Changed from User to Profile

const sharedfunctions = require('../services/sharedfunctions');
let envVariables = sharedfunctions.readenvironmentconfig();
// console.log("Passport config loaded");

const isProduction = process.env.NODE_ENV === 'production';
const BASE_URL = envVariables.BASE_URL;
const GOOGLE_CALLBACK_URL = envVariables.GOOGLE_CALLBACK_URL;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: GOOGLE_CALLBACK_URL,
  proxy: true
}, async (accessToken, refreshToken, googleProfile, done) => {
  try {
    // console.log('🔐 Google OAuth callback for:', googleProfile.emails[0].value);
    
    // Check if profile already exists with this Google ID
    let existingProfile = await Profile.findOne({ googleId: googleProfile.id });
    
    if (existingProfile) {
      // console.log('✅ Existing Google profile found:', existingProfile.email);
      existingProfile.lastLogin = new Date();
      await existingProfile.save();
      return done(null, existingProfile);
    }

    // Check if profile exists with same email (might be email/password user)
    existingProfile = await Profile.findOne({ 
      email: googleProfile.emails[0].value.toLowerCase() 
    });

    if (existingProfile) {
      // console.log('✅ Email exists, linking Google account');
      // Link Google account to existing email/password profile
      existingProfile.googleId = googleProfile.id;
      existingProfile.authProvider = 'google';
      existingProfile.isEmailVerified = true; // Google emails are verified
      existingProfile.avatar = googleProfile.photos[0]?.value || '';
      existingProfile.lastLogin = new Date();
      await existingProfile.save();
      return done(null, existingProfile);
    }

    // Create new profile
    // console.log('📝 Creating new Google profile');
    const newProfile = new Profile({
      googleId: googleProfile.id,
      email: googleProfile.emails[0].value.toLowerCase(),
      name: googleProfile.displayName,
      avatar: googleProfile.photos[0]?.value || '',
      authProvider: 'google',
      isEmailVerified: true, // Google emails are pre-verified
      lastLogin: new Date(),
      isPublic: true
    });
    // CRITICAL: Set userId to profile's own _id BEFORE saving
    newProfile.userId = newProfile._id;

    const savedProfile = await newProfile.save();
    // console.log('✅ New Google profile created:', savedProfile.email);
    return done(null, savedProfile);
    
  } catch (error) {
    console.error('❌ Google OAuth Error:', error);
    return done(error, null);
  }
}));

// Serialize profile for session
passport.serializeUser((profile, done) => {
  done(null, profile._id);
});

// Deserialize profile from session
passport.deserializeUser(async (id, done) => {
  try {
    const profile = await Profile.findById(id);
    done(null, profile);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;