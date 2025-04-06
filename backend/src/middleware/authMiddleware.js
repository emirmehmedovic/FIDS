const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Updated Role-based authentication middleware to accept an array of roles
exports.roleAuth = (allowedRoles) => async (req, res, next) => {
    // Ensure allowedRoles is always an array, even if a single role string is passed
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ msg: "Niste prijavljeni! (Token nije proslijeđen)" });
    }

    try {
        // Verify using only the environment variable secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Basic check for expected payload structure
        if (!decoded || !decoded.user || !decoded.user.id) {
             console.error("Invalid token payload structure:", decoded);
             return res.status(401).json({ msg: "Nevažeći token! (Payload)" });
        }
        
        const user = await User.findByPk(decoded.user.id);
        
        if (!user) {
            return res.status(401).json({ msg: "Korisnik ne postoji!" });
        }

        // Check role if specific roles are required
        // If roles array is empty or not provided, this check is skipped (allows any authenticated user)
        if (roles.length > 0 && !roles.includes(user.role)) {
            return res.status(403).json({ msg: "Nemate ovlasti za pristup ovom resursu!" });
        }

        // Attach user object to request
        req.user = user; 
        next();
    } catch (err) {
        console.error("Greška pri verifikaciji tokena ili autorizaciji:", err.name, err.message);
        // Provide specific messages for common JWT errors
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: "Nevažeći token!" });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: "Token je istekao!" });
        }
        // Generic error for other issues
        res.status(401).json({ msg: "Greška pri autentifikaciji!" });
    }
};

// General authentication middleware (no specific role required)
exports.authenticate = async (req, res, next) => {
    // Extract token from header or cookie
    const token = 
      req.headers.authorization?.split(' ')[1] || // "Bearer TOKEN"
      req.cookies?.token; // Alternative if using cookies
    
    if (!token) {
      return res.status(401).json({ msg: "Niste prijavljeni! (Token nije proslijeđen)" });
    }
  
    try {
      // Verify using only the environment variable secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Basic check for expected payload structure
      if (!decoded || !decoded.user || !decoded.user.id) {
           console.error("Invalid token payload structure:", decoded);
           return res.status(401).json({ msg: "Nevažeći token! (Payload)" });
      }
      
      const user = await User.findByPk(decoded.user.id);
      
      if (!user) {
        return res.status(401).json({ msg: "Korisnik ne postoji!" });
      }
  
      // Attach user object to request
      req.user = user;
      next();
    } catch (err) {
      console.error("Greška pri autentifikaciji:", err.name, err.message);
       // Provide specific messages for common JWT errors
       if (err.name === 'JsonWebTokenError') {
           return res.status(401).json({ msg: "Nevažeći token!" });
       }
       if (err.name === 'TokenExpiredError') {
           return res.status(401).json({ msg: "Token je istekao!" });
       }
       // Generic error for other issues
      res.status(401).json({ msg: "Greška pri autentifikaciji!" });
    }
  };
