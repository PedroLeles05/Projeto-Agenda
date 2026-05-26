const express = require("express");
const workingController = require("../controller/workingHoursController.js");
const auth = require("../middlewares/auth.js");
const router = express.Router();

router.get("/", auth, workingController.get);
router.put("/:_id", auth, workingController.update);

module.exports = router;
