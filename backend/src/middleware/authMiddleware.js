const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Role-based authentication middleware
exports.roleAuth = (role) => async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ msg: "Niste prijavljeni!" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Provjerite strukturu dekodiranog tokena
        console.log("Dekodirani token:", decoded); // <<< DODAJTE OVO ZA DEBUG
        
        const user = await User.findByPk(decoded.user.id);
        
        if (!user) {
            return res.status(401).json({ msg: "Korisnik ne postoji!" });
        }

        if (role && user.role !== role) {
            return res.status(403).json({ msg: "Nemate ovlasti!" });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("Greška pri verifikaciji tokena:", err);
        res.status(401).json({ msg: "Nevažeći token!" });
    }
};

exports.authenticate = async (req, res, next) => {
    // Provjera tokena iz headers ili cookies (ovisno o implementaciji)
    const token = 
      req.headers.authorization?.split(' ')[1] || // "Bearer TOKEN"
      req.cookies?.token; // Alternativa ako se koristi cookie
  
    if (!token) {
      return res.status(401).json({ msg: "Niste prijavljeni!" });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.user.id);
      
      if (!user) {
        return res.status(401).json({ msg: "Korisnik ne postoji!" });
      }
  
      req.user = user;
      next();
    } catch (err) {
      console.error("Greška u middleware-u:", err); // Dodajte detaljno logiranje
      res.status(401).json({ msg: "Nevažeći token!" });
    }
  };
