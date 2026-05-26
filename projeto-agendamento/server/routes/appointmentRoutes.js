const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.js");
const appointmentsController = require("../controller/appointmentsController.js");

router.get("/public/:serviceId", appointmentsController.getTimes);
router.post("/public", appointmentsController.create);

router.get("/", auth, appointmentsController.getAll);
router.put("/:id", auth, appointmentsController.update);
router.delete("/:id", auth, appointmentsController.delete);

module.exports = router;
