const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Role-based authentication middleware
exports.roleAuth = (role) => async (req, res, next) => {
    console.log("roleAuth middleware called with role:", role);
    console.log("Headers:", req.headers);
    
    const token = req.headers.authorization?.split(' ')[1];
    console.log("Token extracted:", token ? "Present" : "Not present");
    
    if (!token) {
        console.log("No token provided");
        return res.status(401).json({ msg: "Niste prijavljeni!" });
    }

    try {
        console.log("JWT Secret exists:", !!process.env.JWT_SECRET);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        
        // Provjerite strukturu dekodiranog tokena
        console.log("Dekodirani token:", decoded);
        
        const user = await User.findByPk(decoded.user.id);
        console.log("User found:", user ? "Yes" : "No");
        
        if (!user) {
            console.log("User not found in database");
            return res.status(401).json({ msg: "Korisnik ne postoji!" });
        }

        if (role && user.role !== role) {
            console.log(`Role mismatch: required ${role}, user has ${user.role}`);
            return res.status(403).json({ msg: "Nemate ovlasti!" });
        }

        console.log("Authentication successful, user role:", user.role);
        req.user = user;
        next();
    } catch (err) {
        console.error("Greška pri verifikaciji tokena:", err);
        res.status(401).json({ msg: "Nevažeći token!" });
    }
};

exports.authenticate = async (req, res, next) => {
    console.log("authenticate middleware called");
    console.log("Headers:", req.headers);
    
    // Provjera tokena iz headers ili cookies (ovisno o implementaciji)
    const token = 
      req.headers.authorization?.split(' ')[1] || // "Bearer TOKEN"
      req.cookies?.token; // Alternativa ako se koristi cookie
    
    console.log("Token extracted:", token ? "Present" : "Not present");
  
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ msg: "Niste prijavljeni!" });
    }
  
    try {
      console.log("JWT Secret exists:", !!process.env.JWT_SECRET);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      console.log("Decoded token:", decoded);
      
      const user = await User.findByPk(decoded.user.id);
      console.log("User found:", user ? "Yes" : "No");
      
      if (!user) {
        console.log("User not found in database");
        return res.status(401).json({ msg: "Korisnik ne postoji!" });
      }
  
      console.log("Authentication successful, user role:", user.role);
      req.user = user;
      next();
    } catch (err) {
      console.error("Greška u middleware-u:", err);
      res.status(401).json({ msg: "Nevažeći token!" });
    }
  };
