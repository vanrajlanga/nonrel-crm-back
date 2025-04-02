// src/middleware/roleMiddleware.js
exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
      // req.user should already be set by the protect middleware
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res
          .status(403)
          .json({ message: 'Access forbidden: insufficient privileges' });
      }
      next();
    };
  };
  