const express = require('express');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and cannot exceed 50 characters')
    .trim(),
  
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and cannot exceed 50 characters')
    .trim(),
  
  body('role')
    .optional()
    .isIn(['researcher', 'coordinator'])
    .withMessage('Role must be researcher or coordinator'),
  
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters')
    .trim()
];

const loginValidation = [
  body('emailOrUsername')
    .notEmpty()
    .withMessage('Email or username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', isNotAuthenticated, registerValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors.array().map(err => err.msg)
      });
    }
    
    const { username, email, password, firstName, lastName, role, department } = req.body;

    // Block admin registration through public endpoint
    if (role === 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin registration is disabled. Contact system owner to provision admin.'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(400).json({
        error: 'User Already Exists',
        message: `A user with this ${field} already exists`
      });
    }
    
    // Create new user
    const allowedRoles = ['researcher', 'coordinator'];
    const finalRole = allowedRoles.includes(role) ? role : 'researcher';

    const newUser = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role: finalRole,
      department
    });
    
    await newUser.save();
    
    // Log the user in automatically after registration
    req.login(newUser, (err) => {
      if (err) {
        console.error('Auto-login error:', err);
        return res.status(201).json({
          message: 'User registered successfully, but auto-login failed',
          user: newUser
        });
      }
      
      res.status(201).json({
        message: 'User registered and logged in successfully',
        user: newUser
      });
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to register user'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', isNotAuthenticated, loginValidation, (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      messages: errors.array().map(err => err.msg)
    });
  }
  
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Login failed due to server error'
      });
    }
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: info.message || 'Invalid credentials'
      });
    }
    
    // Enforce portal-based access control
    const portal = (req.body.portal || '').toLowerCase();
    if (portal === 'user' && user.role === 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin accounts must log in via the admin portal.'
      });
    }
    if (portal === 'admin' && user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admin accounts may use the admin portal.'
      });
    }

    req.login(user, (err) => {
      if (err) {
        console.error('Session error:', err);
        return res.status(500).json({
          error: 'Server Error',
          message: 'Failed to create session'
        });
      }
      
      res.json({
        message: 'Login successful',
        user: user
      });
    });
  })(req, res, next);
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', isAuthenticated, (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to logout'
      });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({
          error: 'Server Error',
          message: 'Failed to destroy session'
        });
      }
      
      res.clearCookie('connect.sid');
      res.json({
        message: 'Logout successful'
      });
    });
  });
});

// @route   GET /api/auth/user
// @desc    Get current user
// @access  Private
router.get('/user', isAuthenticated, (req, res) => {
  res.json({
    user: req.user
  });
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', isAuthenticated, [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name cannot exceed 50 characters')
    .trim(),
  
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name cannot exceed 50 characters')
    .trim(),
  
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters')
    .trim()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors.array().map(err => err.msg)
      });
    }
    
    const { firstName, lastName, department } = req.body;
    const userId = req.user._id;
    
    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(department !== undefined && { department })
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User not found'
      });
    }
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to update profile'
    });
  }
});

// @route   GET /api/auth/check
// @desc    Check authentication status
// @access  Public
router.get('/check', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? req.user : null
  });
});

module.exports = router;
