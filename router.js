const express = require("express");
const router = express.Router();

router.get("/register", async (req, res) => {
    return res.json({ message: "Successfull" })
});




router.get("/", (req, res) => {
    res.send("Server Connection Un-Authorized, 4/4 Security Keys Missing");
});

module.exports = router;