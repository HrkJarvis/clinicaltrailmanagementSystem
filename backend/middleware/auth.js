// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({
    error: 'Unauthorized',
    message: 'You must be logged in to access this resource'
  });
};

// Middleware to check if user is not authenticated (for login/register routes)
const isNotAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  
  return res.status(400).json({
    error: 'Already Authenticated',
    message: 'You are already logged in'
  });
};

// Middleware to check user roles
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }
    
    next();
  };
};

// Middleware to check if user is admin
const isAdmin = hasRole('admin');

// Middleware to check if user is admin or coordinator
const isAdminOrCoordinator = hasRole('admin', 'coordinator');

// Middleware to attach user info to request
const attachUser = (req, res, next) => {
  if (req.isAuthenticated()) {
    req.currentUser = req.user;
  }
  next();
};

// Middleware to validate user owns resource or is admin
const canAccessResource = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    });
  }
  
  // Admin can access any resource
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Check if user owns the resource (assuming resource has createdBy field)
  const resourceUserId = req.body.createdBy || req.params.userId;
  
  if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own resources'
    });
  }
  
  next();
};

module.exports = {
  isAuthenticated,
  isNotAuthenticated,
  hasRole,
  isAdmin,
  isAdminOrCoordinator,
  attachUser,
  canAccessResource
};
