// ========================= users.js =========================
const express = require("express");
const router = express.Router();
const { query } = require("../db");
console.log("Users route file loaded");


// =========================
// AUTH MIDDLEWARE
// =========================
router.use((req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res
            .status(401)
            .json({ message: "Unauthorized - missing Authorization header" });
    }

    const parts = authHeader.split(" ");
    const token = parts.length === 2 ? parts[1] : parts[0];

    if (token !== "admin-token") {
        return res.status(401).json({ message: "Unauthorized" });
    }

    next();
});

// =========================
// GET ALL USERS
// =========================
router.get("/", async (req, res) => {
    try {
        const queryText = `
          SELECT
            "id","firstName","lastName",
            "email","googleId","profileImgUrl",
            "createdAt","updatedAt",
            "plan","hasPurchasedBefore","contactLimit",
            "emailLimit","smsCredits","whatsappCredits",
            "isVerified","is2FAEnabled"
          FROM "User"
          ORDER BY "id" DESC;
        `;

        const result = await query(queryText);
        res.json(result.rows);

    } catch (err) {
        console.error("GET /api/users error:", err);
        res.status(500).json({ message: "Database Error" });
    }
});


// =========================
// GET SINGLE USER + PAYMENTS
// =========================
router.get("/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const userQuery = `
          SELECT
            "id","firstName","lastName","email",
            "plan","contactLimit","emailLimit",
            "smsCredits","whatsappCredits",
            "createdAt","updatedAt"
          FROM "User"
          WHERE "id" = $1;
        `;

        const user = await query(userQuery, [id]);

        if (user.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const paymentsQuery = `
          SELECT *
          FROM "Payment"
          WHERE "userId" = $1
          ORDER BY "id" DESC;
        `;

        const payments = await query(paymentsQuery, [id]);

        res.json({
            user: user.rows[0],
            payments: payments.rows,
        });

    } catch (err) {
        console.error(`GET /api/users/${id} error:`, err);
        res.status(500).json({ message: "Database Error" });
    }
});


module.exports = router;
