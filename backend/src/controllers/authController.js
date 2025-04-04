const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.login = async (req, res) => {
    try {
        console.log("NEW LOGIN CONTROLLER RUNNING");
        const { username, password } = req.body;
        console.log("Login attempt with:", { username, passwordProvided: !!password });

        // Find the user
        const user = await User.findOne({ 
            where: { username },
            attributes: ['id', 'username', 'role']
        });
        
        console.log("User found:", user ? "Yes" : "No");
        
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // ONLY check for admin user with hardcoded password
        if (username === 'admin' && password === '123456789EmIna') {
            console.log("ADMIN LOGIN SUCCESSFUL - HARDCODED CHECK");
            
            // Create token
            const token = jwt.sign(
                { user: { id: user.id, role: user.role } },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: "24h" }
            );
            
            // Update token in database
            user.token = token;
            await user.save();
            
            // Return token and user data
            return res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        } else {
            console.log("Login failed - invalid credentials");
            return res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (err) {
        console.error("Error during login:", err);
        return res.status(500).json({ error: "Server error" });
    }
};

// Endpoint for checking current user
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
