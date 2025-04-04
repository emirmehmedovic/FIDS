const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Koristi Sequelize umjesto direktnih SQL upita
        const user = await User.findOne({ where: { username } });
        
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Provjeri lozinku
        console.log("User found:", !!user); 
        console.log("Password from request:", password ? 'Received' : 'MISSING'); 
        // Log the actual value retrieved from the database
        console.log("Value of user.password from DB:", user.password); 
        
        // Ensure both arguments are valid strings before comparing
        if (typeof password !== 'string' || typeof user.password !== 'string' || !password || !user.password) { // Simplified check for non-empty strings
             console.error("bcrypt.compare arguments invalid:", { passwordType: typeof password, userPasswordType: typeof user.password });
             return res.status(400).json({ error: "Invalid input for password comparison." });
        }
        
        console.log("Comparing password with hash"); // Add log before compare
        const isMatch = await bcrypt.compare(password, user.password); 
        console.log("Password match result:", isMatch); // Log the result
        if (!isMatch) {
            console.log("Password comparison failed."); // Log failure
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Kreiraj token
        const token = jwt.sign(
            { user: { id: user.id, role: user.role } },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: "24h" }
        );

        // Ažuriraj token u bazi
        user.token = token;
        await user.save();

        // Vrati token i osnovne podatke o korisniku
        res.json({ 
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ error: err.message });
    }
};

// Endpoint za provjeru trenutnog korisnika
exports.me = async (req, res) => {
    try {
        // Token se provjerava u authMiddleware, tako da ako smo došli do ovdje, token je validan
        const userId = req.user.id;
        
        // Dohvati korisnika iz baze
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Vrati podatke o korisniku (bez osjetljivih podataka)
        res.json({
            id: user.id,
            username: user.username,
            role: user.role
        });
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ error: err.message });
    }
};
