const express = require("express");
const router = express.Router();
const authController = require("../controller/authController.js");

router.post("/public/login", authController.login);
router.post("/public/register", authController.register);

module.exports = router;
