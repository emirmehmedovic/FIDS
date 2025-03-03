const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const result = await pool.query(
            "SELECT * FROM users WHERE username = $1",
            [username],
        );
        if (result.rowCount === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = result.rows;

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" },
        );

        res.json({ token });
    } catch (err) {
        console.error("Error during login:", err); // Log the error for debugging
        res.status(500).json({ error: err.message });
    }
};