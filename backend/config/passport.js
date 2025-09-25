const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

// Local Strategy Configuration
passport.use(new LocalStrategy({
  usernameField: 'emailOrUsername', // Allow login with email or username
  passwordField: 'password'
}, async (emailOrUsername, password, done) => {
  try {
    // Find user by email or username
    const user = await User.findByEmailOrUsername(emailOrUsername);
    
    if (!user) {
      return done(null, false, { 
        message: 'No user found with that email or username' 
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return done(null, false, { 
        message: 'Account is deactivated. Please contact administrator.' 
      });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return done(null, false, { 
        message: 'Incorrect password' 
      });
    }
    
    // Update last login
    await user.updateLastLogin();
    
    // Authentication successful
    return done(null, user);
    
  } catch (error) {
    console.error('Authentication error:', error);
    return done(error);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return done(null, false);
    }
    
    // Check if user is still active
    if (!user.isActive) {
      return done(null, false);
    }
    
    done(null, user);
    
  } catch (error) {
    console.error('Deserialization error:', error);
    done(error);
  }
});

module.exports = passport;
