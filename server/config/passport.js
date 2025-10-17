// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const sharedfunctions = require('../services/sharedfunctions')
let envVariables = sharedfunctions.readenvironmentconfig();
console.log("shared functions from passport.js: ", envVariables.MONGODB_URI);


// // Load environment-specific .env file
const isProduction = process.env.NODE_ENV === 'production';
// console.log("Isproduction: ", isProduction);
// Set URLs based on environment
const BASE_URL = envVariables.BASE_URL;
const GOOGLE_CALLBACK_URL = envVariables.GOOGLE_CALLBACK_URL;


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let existingUser = await User.findOne({ googleId: profile.id });
    
    if (existingUser) {
      // Update last login
      existingUser.lastLogin = new Date();
      await existingUser.save();
      return done(null, existingUser);
    }

    // Create new user
    const newUser = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      avatar: profile.photos[0].value,
      provider: 'google',
      lastLogin: new Date()
    });

    const savedUser = await newUser.save();
    return done(null, savedUser);
  } catch (error) {
    console.error('Google OAuth Error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate('profile');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});