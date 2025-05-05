const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt"); // Import bcrypt
const User = require("../models/User");

exports.login = async (req, res) => {
    console.log(`[LOGIN START] Received login request for user: ${req?.body?.username}`);
    try {
        const { username, password } = req.body;
        console.log("Login attempt with:", { username, passwordProvided: !!password });

        // Find the user including the password hash
        console.log(`[LOGIN DB] Attempting to find user: ${username}`);
        const user = await User.findOne({ 
            where: { username },
            attributes: ['id', 'username', 'role', 'password_hash'] 
        });
        console.log(`[LOGIN DB] User found result: ${user ? "Yes" : "No"}`);
        
        if (!user) {
            console.log("Login failed - user not found");
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Securely compare the provided password with the stored hash
        console.log(`[LOGIN BCRYPT] Attempting to compare password for user: ${username}`);
        const isMatch = await bcrypt.compare(password, user.password_hash); 
        console.log(`[LOGIN BCRYPT] Password comparison result: ${isMatch}`);

        if (!isMatch) {
            console.log("Login failed - password mismatch");
            return res.status(401).json({ error: "Invalid credentials" });
        }

        console.log("Password match successful for user:", username);

        // Create token - REMOVED insecure fallback key
        console.log(`[LOGIN JWT] Attempting to sign token for user: ${username}`);
        const token = jwt.sign(
            { user: { id: user.id, role: user.role } },
            process.env.JWT_SECRET, // Use environment variable directly
            { expiresIn: "24h" }
        );
        console.log(`[LOGIN JWT] Token signed successfully for user: ${username}`);
        
        console.log(`[LOGIN SUCCESS] Attempting to send response for user: ${username}`);

        // DO NOT save the access token to the database.
        // If implementing refresh tokens, handle that logic separately.
        
        // Return token and user data
        return res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        console.error(`[LOGIN ERROR] Catch block reached for user: ${req?.body?.username}. Error:`, err);
        return res.status(500).json({ error: "Server error" });
    }
};

// Endpoint for checking current user (relies on authenticate middleware)
exports.me = async (req, res) => {
    try {
        // req.user is attached by the authenticate middleware
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
        res.status(500).json({ error: "Failed to fetch user data" });
    }
};

// Endpoint for creating a user (admin only - relies on roleAuth middleware)
exports.createUser = async (req, res) => {
    const { username, password, role } = req.body;

    // Basic validation
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password, and role are required.' });
    }
    const allowedRoles = ['admin', 'stw', 'user']; // Match User model ENUM
    if (!allowedRoles.includes(role)) {
         return res.status(400).json({ error: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}` });
    }

    try {
        // Check if username already exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create new user using the correct field name
        const newUser = await User.create({
          username,
          password_hash: passwordHash, // Use correct field name from model
          role
        });

        // Return only non-sensitive data
        res.status(201).json({ 
          message: 'User created successfully', 
          user: { 
            id: newUser.id, 
            username: newUser.username, 
            role: newUser.role 
          } 
        });
      } catch (err) {
        console.error('Error creating user:', err);
         // Handle potential validation errors from model
         if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
             const messages = err.errors ? err.errors.map(e => e.message) : [err.message];
             return res.status(400).json({ error: messages.join(', ') });
         }
        res.status(500).json({ error: 'Failed to create user' });
      }
};

// Endpoint for getting all users (admin only - relies on roleAuth middleware)
exports.getAllUsers = async (req, res) => {
    try {
        // Fetch users excluding sensitive info
        const users = await User.findAll({
          attributes: ['id', 'username', 'role', 'createdAt', 'updatedAt'], // Exclude password_hash and refreshToken
          order: [['username', 'ASC']]
        });
        res.json(users);
      } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
      }
};

// Endpoint for deleting a user (admin only - relies on roleAuth middleware)
exports.deleteUser = async (req, res) => {
    const userIdToDelete = req.params.id;
    const requestingUserId = req.user.id; // ID of the admin making the request

    // Prevent admin from deleting themselves
    if (parseInt(userIdToDelete, 10) === requestingUserId) {
        return res.status(403).json({ error: 'Admin cannot delete themselves.' });
    }

    try {
        const userToDelete = await User.findByPk(userIdToDelete);
        if (!userToDelete) {
          return res.status(404).json({ error: 'User not found' });
        }
    
        await userToDelete.destroy();
        res.status(204).send(); // No content on successful deletion
      } catch (err) {
        console.error(`Error deleting user with ID ${userIdToDelete}:`, err);
        res.status(500).json({ error: 'Failed to delete user' });
      }
};
